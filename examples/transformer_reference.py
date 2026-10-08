"""Tiny random decoder: full causal forward vs prefill + KV decode.
Requires PyTorch 2.x. No model download; no benchmark or meaningful generation.
MHA only, no padding; cached calls accept exactly one new token.
"""
import argparse
import math
import torch
from torch import nn
from torch.nn import functional as F


def rmsnorm(x, scale):
    return x * torch.rsqrt(x.square().mean(-1, keepdim=True) + 1e-5) * scale


def rope(x, offset):
    d = x.shape[-1]
    positions = torch.arange(offset, offset + x.shape[-2], device=x.device, dtype=x.dtype)
    frequencies = 10000 ** (-torch.arange(0, d, 2, device=x.device, dtype=x.dtype) / d)
    angles = positions[:, None] * frequencies[None, :]
    c, s = angles.cos(), angles.sin()
    even, odd = x[..., 0::2], x[..., 1::2]
    return torch.stack((even * c - odd * s, even * s + odd * c), dim=-1).flatten(-2)


def explicit_attention(q, k, v, causal):
    scores = (q @ k.transpose(-2, -1)) / math.sqrt(q.shape[-1])
    if causal:
        mask = torch.ones(q.shape[-2], k.shape[-2], device=q.device, dtype=torch.bool).tril()
        scores = scores.masked_fill(~mask, float('-inf'))
    return torch.softmax(scores, dim=-1) @ v


class Block(nn.Module):
    def __init__(self, width=32, heads=4, hidden=64):
        super().__init__()
        self.heads, self.d = heads, width // heads
        self.n1 = nn.Parameter(torch.ones(width))
        self.n2 = nn.Parameter(torch.ones(width))
        self.qkv = nn.Linear(width, 3 * width, bias=False)
        self.out = nn.Linear(width, width, bias=False)
        self.gate = nn.Linear(width, hidden, bias=False)
        self.up = nn.Linear(width, hidden, bias=False)
        self.down = nn.Linear(hidden, width, bias=False)

    def forward(self, x, cache=None, explicit=False):
        b, t, width = x.shape
        if cache is not None and t != 1:
            raise ValueError('This teaching cache path supports exactly one new token.')
        q, k, v = self.qkv(rmsnorm(x, self.n1)).chunk(3, dim=-1)
        q, k, v = [a.reshape(b, t, self.heads, self.d).transpose(1, 2) for a in (q, k, v)]
        offset = 0 if cache is None else cache[0].shape[-2]
        q, k = rope(q, offset), rope(k, offset)
        if cache is not None:
            k = torch.cat((cache[0], k), dim=-2)
            v = torch.cat((cache[1], v), dim=-2)
        # Full/prefill is square causal. Cached single-query sees all supplied KV.
        causal = cache is None
        if explicit:
            z = explicit_attention(q, k, v, causal)
        else:
            z = F.scaled_dot_product_attention(q, k, v, dropout_p=0.0, is_causal=causal)
        x = x + self.out(z.transpose(1, 2).reshape(b, t, width))
        r = rmsnorm(x, self.n2)
        return x + self.down(F.silu(self.gate(r)) * self.up(r)), (k, v)


class TinyDecoder(nn.Module):
    def __init__(self, vocab=64, width=32, layers=2):
        super().__init__()
        self.embedding = nn.Embedding(vocab, width)
        self.layers = nn.ModuleList([Block(width) for _ in range(layers)])
        self.norm = nn.Parameter(torch.ones(width))

    def forward(self, ids, caches=None, explicit=False):
        x = self.embedding(ids)
        next_caches = []
        for i, layer in enumerate(self.layers):
            x, kv = layer(x, None if caches is None else caches[i], explicit)
            next_caches.append(kv)
        # Tied embedding / LM head. Return all logits for equivalence checking.
        return F.linear(rmsnorm(x, self.norm), self.embedding.weight), next_caches


@torch.no_grad()
def verify(device):
    torch.manual_seed(7)
    model = TinyDecoder().to(device).eval()
    ids = torch.tensor([[1, 7, 3, 8, 2, 5], [9, 6, 1, 4, 3, 2]], device=device)
    full, _ = model(ids)
    manual, _ = model(ids, explicit=True)
    torch.testing.assert_close(full, manual, rtol=2e-4, atol=2e-4)
    for prefix in (1, 3, 5):
        initial, caches = model(ids[:, :prefix])
        outputs = [initial]
        for pos in range(prefix, ids.shape[1]):
            logits, caches = model(ids[:, pos:pos + 1], caches)
            outputs.append(logits)
            assert all(k.shape[-2] == pos + 1 and v.shape[-2] == pos + 1 for k, v in caches)
        streamed = torch.cat(outputs, dim=1)
        torch.testing.assert_close(full, streamed, rtol=2e-4, atol=2e-4)
        print(f'PASS prefill={prefix}, max |full-cached| = {(full - streamed).abs().max().item():.3g}')
    # Causality: changing a future token must not alter earlier positions.
    changed = ids.clone()
    changed[:, -1] = (changed[:, -1] + 1) % 64
    altered, _ = model(changed)
    torch.testing.assert_close(full[:, :-1], altered[:, :-1], rtol=2e-4, atol=2e-4)
    print(f'PASS explicit attention and causal invariance; device={device}, torch={torch.__version__}')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--device', choices=('cpu', 'cuda', 'mps'), default='cpu')
    args = parser.parse_args()
    verify(args.device)

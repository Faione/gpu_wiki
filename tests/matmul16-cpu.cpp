#include "../examples/matmul16_cpu.hpp"
#include <cassert>
#include <cstdio>

int main() {
    float A[256], B[256], D[256];
    for (int i = 0; i < 16; ++i) for (int j = 0; j < 16; ++j) {
        A[i * 16 + j] = float((i + j) % 5 - 2);
        B[i * 16 + j] = float((i + 2 * j) % 7 - 3);
    }
    matmul_cpu(A, B, D);
    for (int i = 0; i < 16; ++i) for (int j = 0; j < 16; ++j) {
        int exact = 0;
        for (int k = 0; k < 16; ++k)
            exact += int(A[i * 16 + k]) * int(B[k * 16 + j]);
        assert(D[i * 16 + j] == float(exact));
    }
    for (int p = 0; p < 256; ++p) B[p] = (p / 16 == p % 16) ? 1.f : 0.f;
    matmul_cpu(A, B, D);
    for (int p = 0; p < 256; ++p) assert(D[p] == A[p]);
    for (float& x : B) x = 0.f;
    matmul_cpu(A, B, D);
    for (float x : D) assert(x == 0.f);
    std::puts("PASS: 16x16 CPU reference (integer oracle, identity, zero)");
}

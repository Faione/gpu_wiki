// Teaching comparison, not a performance benchmark or general-size GEMM.
// Build on a CUDA machine, selecting the actual supported target, for example:
// nvcc -std=c++17 -O2 -arch=sm_80 examples/matmul16.cu -o /tmp/matmul16
// The FP16 WMMA form requires a supported target of compute capability >= 7.0.
#include <cuda_runtime.h>
#include <cuda_fp16.h>
#include <mma.h>
#include <algorithm>
#include <cstdio>
#include <cstdlib>
#include "matmul16_cpu.hpp"

static void check(cudaError_t status, const char* operation) {
    if (status != cudaSuccess) {
        std::fprintf(stderr, "%s: %s\n", operation, cudaGetErrorString(status));
        std::exit(EXIT_FAILURE);
    }
}
#define CUDA_CHECK(call) check((call), #call)

// Exactly <<<1, 256>>>: one thread owns one output element.
__global__ void matmul_simt(const float* A, const float* B, float* D) {
    const int t = threadIdx.x;
    const int i = t / 16, j = t % 16;
    float acc = 0.0f;
    for (int k = 0; k < 16; ++k)
        acc = fmaf(A[i * 16 + k], B[k * 16 + j], acc);
    D[i * 16 + j] = acc;
}

// Exactly <<<1, 32>>>: the entire warp cooperates on ONE output tile.
__global__ void matmul_wmma(const __half* A, const __half* B, float* D) {
    using namespace nvcuda;
    wmma::fragment<wmma::matrix_a, 16, 16, 16, __half, wmma::row_major> a;
    wmma::fragment<wmma::matrix_b, 16, 16, 16, __half, wmma::row_major> b;
    wmma::fragment<wmma::accumulator, 16, 16, 16, float> acc;
    wmma::fill_fragment(acc, 0.0f);
    wmma::load_matrix_sync(a, A, 16);
    wmma::load_matrix_sync(b, B, 16);
    wmma::mma_sync(acc, a, b, acc);
    wmma::store_matrix_sync(D, acc, 16, wmma::mem_row_major);
}

int main() {
    constexpr int elements = 16 * 16;
    float A[elements], B[elements], reference[elements];
    float simt[elements], tensor[elements];
    __half Ah[elements], Bh[elements];
    // Non-symmetric, signed small integers: exact FP16 inputs and small sums.
    // Convert back so every path consumes the SAME quantized input values.
    for (int i = 0; i < 16; ++i) for (int j = 0; j < 16; ++j) {
        const int p = i * 16 + j;
        Ah[p] = __float2half(float((i + j) % 5 - 2));
        Bh[p] = __float2half(float((i + 2 * j) % 7 - 3));
        A[p] = __half2float(Ah[p]);
        B[p] = __half2float(Bh[p]);
    }
    matmul_cpu(A, B, reference);
    CUDA_CHECK(cudaSetDevice(0));
    cudaDeviceProp prop{};
    CUDA_CHECK(cudaGetDeviceProperties(&prop, 0));
    if (prop.major < 7) {
        std::fprintf(stderr, "This FP16 WMMA example needs a supported SM 7.0+ target.\n");
        return EXIT_FAILURE;
    }
    float *dA = nullptr, *dB = nullptr, *dSimt = nullptr, *dTensor = nullptr;
    __half *dAh = nullptr, *dBh = nullptr;
    // Base pointers from cudaMalloc meet WMMA alignment; all strides are 16.
    CUDA_CHECK(cudaMalloc(&dA, sizeof(A)));
    CUDA_CHECK(cudaMalloc(&dB, sizeof(B)));
    CUDA_CHECK(cudaMalloc(&dSimt, sizeof(simt)));
    CUDA_CHECK(cudaMalloc(&dTensor, sizeof(tensor)));
    CUDA_CHECK(cudaMalloc(&dAh, sizeof(Ah)));
    CUDA_CHECK(cudaMalloc(&dBh, sizeof(Bh)));
    CUDA_CHECK(cudaMemcpy(dA, A, sizeof(A), cudaMemcpyHostToDevice));
    CUDA_CHECK(cudaMemcpy(dB, B, sizeof(B), cudaMemcpyHostToDevice));
    CUDA_CHECK(cudaMemcpy(dAh, Ah, sizeof(Ah), cudaMemcpyHostToDevice));
    CUDA_CHECK(cudaMemcpy(dBh, Bh, sizeof(Bh), cudaMemcpyHostToDevice));
    matmul_simt<<<1, 256>>>(dA, dB, dSimt);
    CUDA_CHECK(cudaGetLastError());
    matmul_wmma<<<1, 32>>>(dAh, dBh, dTensor);
    CUDA_CHECK(cudaGetLastError());
    CUDA_CHECK(cudaDeviceSynchronize());
    CUDA_CHECK(cudaMemcpy(simt, dSimt, sizeof(simt), cudaMemcpyDeviceToHost));
    CUDA_CHECK(cudaMemcpy(tensor, dTensor, sizeof(tensor), cudaMemcpyDeviceToHost));
    float simtError = 0, tensorError = 0;
    bool finite = true;
    for (int p = 0; p < elements; ++p) {
        finite = finite && std::isfinite(simt[p]) && std::isfinite(tensor[p]);
        simtError = std::max(simtError, std::fabs(simt[p] - reference[p]));
        tensorError = std::max(tensorError, std::fabs(tensor[p] - reference[p]));
    }
    std::printf("Device: %s\nSIMT max abs error: %g\nWMMA max abs error: %g\n",
                prop.name, double(simtError), double(tensorError));
    // Exact comparison is appropriate only for THESE bounded integer inputs.
    const bool passed = finite && simtError == 0 && tensorError == 0;
    std::puts(passed ? "PASS: all 256 outputs agree" : "FAIL: output mismatch");
    CUDA_CHECK(cudaFree(dA)); CUDA_CHECK(cudaFree(dB));
    CUDA_CHECK(cudaFree(dAh)); CUDA_CHECK(cudaFree(dBh));
    CUDA_CHECK(cudaFree(dSimt)); CUDA_CHECK(cudaFree(dTensor));
    return passed ? EXIT_SUCCESS : EXIT_FAILURE;
}

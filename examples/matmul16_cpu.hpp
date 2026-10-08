#pragma once
#include <cmath>

// Row-major 16x16 matrices; D must not alias A or B. Reference, not tuned GEMM.
inline void matmul_cpu(const float* A, const float* B, float* D) {
    for (int i = 0; i < 16; ++i) {
        for (int j = 0; j < 16; ++j) {
            float acc = 0.0f;
            for (int k = 0; k < 16; ++k)
                acc = std::fma(A[i * 16 + k], B[k * 16 + j], acc);
            D[i * 16 + j] = acc;
        }
    }
}

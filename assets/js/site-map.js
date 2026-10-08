window.GPU_BOOK = [
  {
    "page": "../chapters/chapter-01.html",
    "id": "top",
    "title": "第一章：从 CPU 到 GPU",
    "group": "正文",
    "sections": [
      {
        "id": "tradeoff",
        "title": "1.1 单任务延迟与整体吞吐量"
      },
      {
        "id": "cpu-latency",
        "title": "1.2 执行资源可用性与指令就绪条件"
      },
      {
        "id": "cpu-to-gpu-bridge",
        "title": "1.3 从独立指令到多线程执行"
      },
      {
        "id": "gpu-latency",
        "title": "1.4 驻留执行组之间的交叠执行"
      },
      {
        "id": "simt",
        "title": "1.5 共享一条指令，处理不同数据"
      },
      {
        "id": "overview",
        "title": "1.6 执行机制对应的 GPU 硬件结构"
      },
      {
        "id": "check",
        "title": "1.7 延迟、分歧与资源约束的概念辨析"
      }
    ]
  },
  {
    "page": "../chapters/chapter-hardware.html",
    "id": "top",
    "title": "第二章：计算、存储与数据搬运",
    "group": "正文",
    "sections": [
      {
        "id": "compute-path",
        "title": "2.1 从就绪指令到运算结果"
      },
      {
        "id": "memory-hierarchy",
        "title": "2.2 操作数存放在哪里"
      },
      {
        "id": "memory-coalescing",
        "title": "2.3 多个线程的地址如何变成访存请求"
      },
      {
        "id": "data-reuse",
        "title": "2.4 复用数据与块内协作"
      },
      {
        "id": "host-device-transfer",
        "title": "2.5 从主机内存到 GPU 数据路径"
      },
      {
        "id": "hardware-bottlenecks",
        "title": "2.6 计算能力与数据供给如何共同限制性能"
      },
      {
        "id": "hardware-summary",
        "title": "2.7 从硬件需求到软件提交"
      }
    ]
  },
  {
    "page": "../chapters/chapter-02.html",
    "id": "top",
    "title": "第三章：从驱动到硬件执行",
    "group": "正文",
    "sections": [
      {
        "id": "software-device",
        "title": "3.1 软件眼中的 GPU 是什么"
      },
      {
        "id": "driver-layers",
        "title": "3.2 运行时、用户态驱动与内核态驱动"
      },
      {
        "id": "driver-objects",
        "title": "3.3 驱动接口如何表示一次计算"
      },
      {
        "id": "code-to-launch",
        "title": "3.4 从一段 CUDA 代码到一次启动请求"
      },
      {
        "id": "submission-path",
        "title": "3.5 启动请求如何到达 SM"
      },
      {
        "id": "launch-mapping",
        "title": "3.6 代码、启动配置与硬件资源的对应关系"
      },
      {
        "id": "completion-order",
        "title": "3.7 提交、执行与完成的区别"
      },
      {
        "id": "driver-summary",
        "title": "3.8 核心关系与自检"
      }
    ]
  },
  {
    "page": "../chapters/chapter-matrix.html",
    "id": "top",
    "title": "第四章：矩阵乘法的软硬件实现",
    "group": "正文",
    "sections": [
      {
        "id": "gemm-semantics",
        "title": "4.1 算子层：计算什么，哪些工作可以独立"
      },
      {
        "id": "gemm-software",
        "title": "4.2 软件层：从矩阵接口到设备程序"
      },
      {
        "id": "gemm-tiling",
        "title": "4.3 工作分解：输出分块，K 方向分轮累加"
      },
      {
        "id": "gemm-dataflow",
        "title": "4.4 数据流：搬入、复用、累加与写出"
      },
      {
        "id": "gemm-hardware",
        "title": "4.5 硬件层：矩阵计算与搬运如何交叠"
      },
      {
        "id": "gemm-performance",
        "title": "4.6 性能分析：分块为何存在相互制约"
      },
      {
        "id": "gemm-transformer",
        "title": "4.7 回到 Transformer 与 CANN"
      }
    ]
  },
  {
    "page": "../chapters/chapter-transformer.html",
    "id": "top",
    "title": "第五章：Transformer 的软硬件执行",
    "group": "正文",
    "sections": [
      {
        "id": "tf-architecture",
        "title": "5.1 架构、参数与运行时状态"
      },
      {
        "id": "tf-block",
        "title": "5.2 完整一层与张量形状"
      },
      {
        "id": "tf-execution",
        "title": "5.3 从框架到 GPU 执行"
      },
      {
        "id": "tf-attention",
        "title": "5.4 Attention 数值与分块"
      },
      {
        "id": "tf-phases",
        "title": "5.5 训练、Prefill 与 Decode"
      },
      {
        "id": "tf-memory",
        "title": "5.6 参数、KV 与瓶颈"
      },
      {
        "id": "tf-open-source",
        "title": "5.7 开源实现阅读路线"
      },
      {
        "id": "tf-practice",
        "title": "5.8 运行与正确性验证"
      }
    ]
  },
  {
    "page": "../appendices/appendix-01.html",
    "id": "thread-instance",
    "title": "附录 1：线程与执行状态",
    "group": "附录"
  },
  {
    "page": "../appendices/appendix-02.html",
    "id": "thread-to-sm",
    "title": "附录 2：Block 与 Warp 的分工",
    "group": "附录"
  },
  {
    "page": "../appendices/appendix-03.html",
    "id": "appendix-execution",
    "title": "附录 3：成组执行与硬件多线程",
    "group": "附录"
  },
  {
    "page": "../appendices/appendix-04.html",
    "id": "appendix-configuration",
    "title": "附录 4：线程配置、编号与设计依据",
    "group": "附录"
  },
  {
    "page": "../appendices/appendix-05.html",
    "id": "appendix-allocation",
    "title": "附录 5：SM 的组成与资源分配",
    "group": "附录"
  },
  {
    "page": "../appendices/appendix-06.html",
    "id": "appendix-residency",
    "title": "附录 6：驻留、状态保留与调度",
    "group": "附录"
  },
  {
    "page": "../appendices/appendix-07.html",
    "id": "question",
    "title": "附录 7：SIMD 与 SIMT 编程模型",
    "group": "附录"
  },
  {
    "page": "../appendices/appendix-08.html",
    "id": "kernel-basics",
    "title": "附录 8：Kernel 的定义与启动",
    "group": "附录"
  },
  {
    "page": "../appendices/appendix-09.html",
    "id": "background",
    "title": "附录 9：SIMD：向量、lane 与向量化",
    "group": "附录"
  },
  {
    "page": "../appendices/appendix-10.html",
    "id": "simt",
    "title": "附录 10：SIMT：线程行为与成组执行",
    "group": "附录"
  },
  {
    "page": "../appendices/appendix-11.html",
    "id": "mechanism",
    "title": "附录 11：Warp 发射与分支分歧",
    "group": "附录"
  },
  {
    "page": "../appendices/appendix-12.html",
    "id": "comparison",
    "title": "附录 12：SIMD 与 SIMT 的差异及适用条件",
    "group": "附录"
  },
  {
    "page": "../appendices/appendix-13.html",
    "id": "conclusion",
    "title": "附录 13：并行执行概念辨析",
    "group": "附录"
  },
  {
    "page": "../appendices/appendix-14.html",
    "id": "integer-float",
    "title": "附录 14：整数与浮点运算",
    "group": "附录"
  },
  {
    "page": "../appendices/appendix-15.html",
    "id": "matrix-instructions",
    "title": "附录 15：矩阵指令与 Tensor Core",
    "group": "附录"
  },
  {
    "page": "../appendices/appendix-16.html",
    "id": "compute-circuits",
    "title": "附录 16：计算部件与教学电路",
    "group": "附录"
  },
  {
    "page": "../appendices/appendix-17.html",
    "id": "memory-reference",
    "title": "附录 17：存储规格与测量口径",
    "group": "附录"
  },
  {
    "page": "../appendices/appendix-18.html",
    "id": "cpu-reference",
    "title": "附录 18：CPU 机制与资源预算复习",
    "group": "附录"
  }
];

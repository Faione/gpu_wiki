/* 本地运行的理解检查：题干、选项、正确选项下标、解析、回读位置。 */
(() => {
  const banks = {
    'gemm-semantics': [
      ['A[M,K] × B[K,N] 中，K 决定什么？', ['每个输出累加的乘积数量', 'GPU 上必须使用的 SM 数量'], 0, 'M、N 决定输出坐标，K 是归约维度；它们不是硬件单元数量。', 'chapter-matrix.html#gemm-semantics'],
      ['不同输出元素互相独立，是否意味着同一输出的 K 维部分和可以直接丢弃？', ['可以，所有乘法都独立', '不可以，部分和必须正确合并'], 1, '输出空间的并行与归约维度的结果合并是两种关系。', 'chapter-matrix.html#gemm-semantics']
    ],
    'gemm-software': [
      ['一行 MatMul 调用是否就是一条 GPU 矩阵指令？', ['是，软件调用与指令一一对应', '不是，实现还包含搬运、循环、同步等工作'], 1, '库或编译器组织完整任务，矩阵指令只承担其中受支持的乘加操作。', 'chapter-matrix.html#gemm-software'],
      ['只知道 M、N、K，是否足以确定数据地址与计算精度？', ['不足，还需要布局、步长与类型等信息', '足够，矩阵形状包含全部实现信息'], 0, '数学形状不规定物理存储步长，也不规定输入与累加格式。', 'chapter-matrix.html#gemm-software']
    ],
    'gemm-tiling': [
      ['M=N=128，每块负责 64×64 输出且不使用 Split-K，需要多少输出块？', ['4 个', '64 个'], 0, '两个方向分别分为 2 块，共 2×2=4 块。每块内部仍须遍历整个 K。', 'chapter-matrix.html#gemm-tiling'],
      ['一个 Block 用 128 个线程计算 4096 个输出，是否在模型上矛盾？', ['矛盾，每线程只能保存一个结果', '不矛盾，线程可共同持有多个输出的片段'], 1, '逻辑工作量、线程数量与物理计算资源没有一一对应关系。', 'chapter-matrix.html#gemm-tiling']
    ],
    'gemm-dataflow': [
      ['每轮 K 计算后，部分和是否必须写回显存？', ['必须，下一轮从显存重新读取', '不必，可在片上累加状态中跨轮保留'], 1, '保留累加器可减少部分和搬运；其容量也是分块的约束。', 'chapter-matrix.html#gemm-dataflow'],
      ['同属一个 Block，能否省略输入生产者与消费者之间的必要同步？', ['不能，分组本身不证明搬运与读取已经完成', '能，共享内存始终自动准备好'], 0, '读前需保证数据可见，覆盖缓冲前需保证此前读取结束。', 'chapter-matrix.html#gemm-dataflow']
    ],
    'gemm-hardware': [
      ['TMA 和 Tensor Core 的职责是否相同？', ['相同，都直接做矩阵乘加', '不同，TMA 负责受支持的张量搬运'], 1, '异步搬运与矩阵计算可以协作，但需要遵守完成与数据依赖协议。', 'chapter-matrix.html#gemm-hardware'],
      ['双缓冲是否保证所有搬运等待被隐藏？', ['不保证，还受阶段耗时、依赖与资源限制', '保证，缓冲数量决定固定两倍加速'], 0, '交叠机会不等于固定加速比，流水还有预装载、收尾和资源成本。', 'chapter-matrix.html#gemm-hardware']
    ],
    'gemm-performance': [
      ['固定 B_M、B_N 和类型，只增大 B_K，本章的每轮输入复用比如何变化？', ['提高，因为每轮计算更多', '不变，输入与运算量同比增加'], 1, 'B_K 在该比值中约去；缓冲容量仍增加。这不等于真实 DRAM 流量一定不变。', 'chapter-matrix.html#gemm-performance'],
      ['更大的输出 tile 是否必然更快？', ['不一定，复用提高也可能增加资源占用并减少工作块', '必然，复用是唯一的性能因素'], 0, '应同时测量利用率、资源限制、并行度和实际耗时。', 'chapter-matrix.html#gemm-performance']
    ],
    'gemm-transformer': [
      ['Attention 使用矩阵计算后，Softmax 的归约和中间状态是否随之消失？', ['不会，仍需单独组织或在融合实现中处理', '会，矩阵指令自动实现完整 Attention'], 0, '矩阵乘法只覆盖部分运算；融合改变数据与工作组织，不删除算法依赖。', 'chapter-matrix.html#gemm-transformer'],
      ['将 GPU GEMM 优化迁移到 CANN，哪种方式更可靠？', ['将 Warp、SM 名称直接替换为 Cube、AI Core', '保留分块与数据流问题，重新核实目标硬件及接口'], 1, '线程组织、存储和同步机制存在差异，不能按名称一一映射。', 'chapter-matrix.html#gemm-transformer']
    ],
    'integer-float': [
      ['同为 32 位，FP32 是否能精确表示所有 uint32_t 的值？', ['能，位数相同就有相同精度', '不能，FP32 将部分位用于指数'], 1, 'FP32 具有较大动态范围，但不能精确表示每个 32 位无符号整数。', 'appendix-14.html#number-representation'],
      ['浮点数没有溢出，是否意味着计算结果没有误差？', ['不意味着，有限有效位仍可能造成舍入', '意味着，误差只来自溢出'], 0, '表示误差和舍入可以发生在正常范围内。', 'appendix-14.html#rounding-overflow'],
      ['改变并行求和的顺序，是否可能改变 FP32 结果？', ['可能，各步舍入位置会变化', '不可能，加法始终满足实数结合律'], 0, '浮点加法不普遍满足结合律，应根据算法误差要求判断结果。', 'appendix-14.html#order-fma']
    ],
    'matrix-instructions': [
      ['Warp 级矩阵指令是否表示每线程各计算一整个矩阵块？', ['是，32 个线程得到 32 份完整结果', '不是，线程共同提供操作数并持有结果片段'], 1, '矩阵块的片段分布在参与线程中；接口或指令规定映射。', 'appendix-15.html#matrix-fragments'],
      ['m16n8k16 的乘加按 2MNK 计为 4096 FLOP，是否还需乘 32？', ['不需要，这已是整个 Warp 该项工作的计数', '需要，每个线程重复完整工作'], 0, '线程协作完成同一矩阵操作，不将工作量按参与线程重复计数。', 'appendix-15.html#matrix-ptx'],
      ['FP16 输入用 FP32 累加，能否恢复输入转为 FP16 时丢失的位？', ['能，累加器更宽', '不能，只能减少后续累加的部分误差'], 1, '较宽累加器不能恢复未保留在输入中的信息。', 'appendix-15.html#matrix-precision']
    ],
    'compute-path': [
      ['Warp 发射一条加法指令后，是否意味着结果已经产生？', ['是，发射与完成是同一个时刻', '否，指令还需经过执行流水线'], 1, '发射表示指令进入执行过程，依赖结果的后续指令仍需等待结果就绪。', 'chapter-hardware.html#compute-path'],
      ['普通标量加法是否自动由 Tensor Core 完成？', ['不是，矩阵资源需要对应的受支持操作', '是，所有计算都使用同一种执行资源'], 0, '不同指令使用相应资源；专用矩阵运算能力不能直接当作任意计算的吞吐能力。', 'chapter-hardware.html#compute-path']
    ],
    'memory-hierarchy': [
      ['Local Memory 中的“Local”是否保证数据在 SM 片上？', ['保证，它就是寄存器', '不保证，它描述线程私有的内存空间'], 1, '逻辑访问范围不决定物理位置；Local Memory 可以经缓存访问设备内存。', 'chapter-hardware.html#memory-hierarchy'],
      ['一次全局加载命中缓存后，还必须读取 DRAM 吗？', ['不必，数据可由缓存提供', '必须，全局内存就是每次直达 DRAM'], 0, '全局是存储空间语义，缓存决定这次访问可能由哪一层提供数据。', 'chapter-hardware.html#memory-hierarchy']
    ],
    'memory-coalescing': [
      ['本节模型中，32 个线程连续读取对齐的 4 字节元素，共覆盖多少个 32 字节段？', ['4 个', '32 个'], 0, '有效数据共 128 字节，连续且对齐时覆盖 4 段。段数不直接等于实际 DRAM 访问次数。', 'chapter-hardware.html#memory-coalescing'],
      ['访存合并是否会重新划分 Warp 成员？', ['会，地址相邻的线程组成新 Warp', '不会，它组织已有 Warp 的地址请求'], 1, '成员划分与请求合并是不同机制。合并也不提供整组更新的原子性。', 'chapter-hardware.html#memory-coalescing']
    ],
    'data-reuse': [
      ['把只使用一次的数据先放入共享内存，是否必然更快？', ['必然，共享内存更靠近计算资源', '不一定，搬运、同步与容量占用也有代价'], 1, '收益取决于是否减少重复访问、改善布局，以及额外工作的成本。', 'chapter-hardware.html#data-reuse'],
      ['bank 冲突是否就是缺少同步造成的数据竞争？', ['不是，前者是访问资源争用，后者涉及程序正确性', '是，增加屏障就能消除全部 bank 冲突'], 0, 'bank 冲突通常需要从地址布局与访问模式考虑；同步负责建立正确的协作依赖。', 'chapter-hardware.html#data-reuse']
    ],
    'host-device-transfer': [
      ['Kernel A 的输出立即供 GPU 上的 Kernel B 使用，是否必须先复制回 CPU？', ['必须，每次启动都重新传输全部数据', '不必，数据可以留在设备并建立正确依赖'], 1, '一次计算完成不意味着数据必须离开设备。正确组织后续工作可减少往返搬运。', 'chapter-hardware.html#host-device-transfer'],
      ['一个 Stream 是否等于一个 Kernel？', ['不是，一个 Stream 可以安排多次计算与复制', '是，它们都是一次计算的名称'], 0, 'Kernel 描述计算代码，启动产生工作，Stream 表达操作的顺序关系。', 'chapter-hardware.html#host-device-transfer']
    ],
    'hardware-bottlenecks': [
      ['教学模型中 P = 10 TFLOP/s，B = 1 TB/s，I = 2 FLOP/byte，上限是多少？', ['10 TFLOP/s', '2 TFLOP/s'], 1, 'B × I = 2 TFLOP/s，比计算侧上限更低。实际性能还可能受到其他约束。', 'chapter-hardware.html#hardware-bottlenecks'],
      ['缓存复用减少了 DRAM 流量，在运算量不变时，DRAM 边界的算术强度如何变化？', ['提高', '不变，算术强度只由指令决定'], 0, '算术强度是运算量与指定边界数据流量的比值，必须说明字节统计的边界。', 'chapter-hardware.html#hardware-bottlenecks']
    ],
    'hardware-summary': [
      ['延迟隐藏与访存合并的主要作用是否相同？', ['相同，都会让单次 DRAM 访问立即完成', '不同，前者提供可执行工作，后者改善请求组织'], 1, '还可通过数据复用减少所需搬运量。三种机制对应不同的约束。', 'chapter-hardware.html#hardware-bottlenecks'],
      ['SM 算力很高，是否足以证明整个应用很快？', ['不足以，还需考虑数据供给、搬运与软件开销', '足以，其他模块不会限制计算'], 0, '整体流程需要同时满足计算、存储与提交的条件，这也是后续驱动章的连接点。', 'chapter-hardware.html#hardware-summary']
    ],
    tradeoff: [
      ['一项计算必须等待上一步结果，增加运算单元能否保证它更快完成？', ['能，单元数量决定单任务速度', '不能，数据依赖仍会限制并行执行'], 1, '吞吐能力需要足够的独立工作才能发挥。依赖链上的下一步仍需等待操作数。', 'chapter-01.html#tradeoff'],
      ['固定面积预算下，增加缓存与复杂控制逻辑，为什么可能减少并行计算资源？', ['不同资源竞争芯片面积与功耗预算', '缓存越大，所有程序必然越慢'], 0, '这是资源分配的取舍，不是性能的单调关系。缓存减少访存等待，也可能提高实际吞吐量。', 'appendix-18.html#budget-performance']
    ],
    'cpu-latency': [
      ['加法器空闲，但加法需要的加载结果尚未返回。这条加法能否执行？', ['能，硬件资源已经空闲', '不能，操作数仍未就绪'], 1, '执行需要同时满足依赖就绪与相关资源可用。空闲资源无法替代缺失的数据。', 'chapter-01.html#cpu-latency'],
      ['OoO 与 SMT 能否同时存在于一个 CPU 核心中？', ['能，前者寻找可执行指令，后者提供多个硬件线程的工作', '不能，两者是互斥的调度模式'], 0, '乱序执行和多线程提供独立工作的方式不同，可以组合使用；它们都不能违反数据依赖。', 'chapter-01.html#cpu-latency']
    ],
    'cpu-to-gpu-bridge': [
      ['硬件从线程 A 转而推进线程 B 后，为什么仍要保留 A 的状态？', ['为了重新编译 A 的程序', '为了稍后从原有执行位置和数据继续推进'], 1, '未完成的线程需要保留寄存器值及控制状态。驻留状态使硬件无需在每次选择工作时进行 OS 式上下文搬运。', 'chapter-01.html#cpu-to-gpu-bridge'],
      ['多个线程执行相同加法指令，是否意味着它们的操作数也相同？', ['不意味着，各线程可以提供不同寄存器值', '意味着，共享指令也共享全部数据'], 0, '共享的是操作类型；每个线程的数据仍具有独立的逻辑身份。', 'chapter-01.html#cpu-to-gpu-bridge']
    ],
    'gpu-latency': [
      ['Warp A 等待加载，Warp B 就绪。发射 B 的指令主要改变了什么？', ['A 的内存请求必然更早返回', '等待期间执行资源可以处理其他工作'], 1, '延迟隐藏覆盖的是资源空闲时间，并不意味着原请求的服务时间缩短。', 'chapter-01.html#gpu-latency'],
      ['SM 中有多个驻留 Warp，为什么仍可能没有指令可发射？', ['所有候选 Warp 都可能在等待依赖或所需资源', '驻留 Warp 必然每周期都执行'], 0, '驻留只表示状态已获得资源承载；就绪还要求依赖与执行条件满足。', 'chapter-01.html#gpu-latency']
    ],
    simt: [
      ['同一 Warp 中一部分线程执行加法，另一部分执行乘法，通常如何处理？', ['把两种操作变成一次共同的算术操作', '分路径处理相应活跃线程，或对适合的短分支采用谓词化'], 1, '线程可以选择不同路径，但同一次共同指令并不让各线程任意选择不同操作码。', 'chapter-01.html#simt'],
      ['谓词化中的谓词是什么？', ['决定某条指令对当前线程是否生效的条件', '预测下次分支走向的概率'], 0, '谓词表达条件的真假。它与分支预测不同，不能消除不同路径带来的所有执行开销。', 'chapter-01.html#predication-basics']
    ],
    overview: [
      ['一次启动包含 2 个 Block，每个 64 个线程。在 NVIDIA 模型中，共有多少个 Warp？', ['2 个', '4 个', '数量等于 SM 数'], 1, '每个 Block 独立划分为两个 32 线程的 Warp，共四个。SM 数量不决定这项划分。', 'chapter-01.html#sm-block-warp-map'],
      ['SM、Block 与 Warp 的关系，哪项正确？', ['每个 Block 都有一套专属的物理 SM', 'Block 是线程工作组，Warp 是其中的执行分组，SM 是承载它们的硬件'], 1, '一个 SM 可以容纳多个 Block 和 Warp，但受寄存器、共享内存及硬件上限约束。', 'chapter-01.html#overview']
    ],
    'software-device': [
      ['软件中的设备编号表示什么？', ['程序选择的 GPU 设备', '当前执行线程的 Warp 编号'], 0, '设备是软件选择计算与存储资源的入口，设备编号不指定某个 SM 或 Warp。', 'chapter-02.html#software-device'],
      ['GPU 线程是否通常对应一个 CPU 操作系统线程？', ['是，驱动逐个创建 OS 线程', '否，它是 Kernel 的逻辑执行实例'], 1, 'GPU 线程的执行状态由设备资源承载，CPU 提交的是带有执行配置的工作。', 'chapter-02.html#software-device']
    ],
    'driver-layers': [
      ['普通驻留 Warp 的逐次指令调度，主要由谁完成？', ['GPU 内的硬件调度机制', 'CPU 驱动为每条指令发起系统调用'], 0, '驱动组织资源与提交工作；已经驻留的 Warp 由 GPU 硬件选择并推进。', 'chapter-02.html#driver-layers'],
      ['CUDA Runtime、用户态驱动与内核态驱动是否就是三个 GPU 运算单元？', ['是，它们分别执行三类指令', '否，它们是主机侧软件栈中的不同层次'], 1, '这些软件层次承担接口、资源与设备管理等职责，实际设备指令由 GPU 执行。', 'chapter-02.html#driver-layers']
    ],
    'driver-objects': [
      ['CUDA 上下文与驻留 Warp 状态是否相同？', ['相同，都只是一组线程寄存器', '不同，前者管理执行环境与资源，后者承载正在执行的线程状态'], 1, '相同的“上下文”用语涉及不同层次，不能把驱动管理对象等同于 SM 内的线程状态。', 'chapter-02.html#driver-objects'],
      ['Stream 最直接表达哪种关系？', ['提交操作之间的顺序', '某个专属 SM 的物理位置'], 0, 'Stream 是软件顺序抽象，不与 SM 普遍一一对应。', 'chapter-02.html#driver-objects']
    ],
    'code-to-launch': [
      ['对 100 个元素启动 2 个 Block、每个 64 个线程，并检查 i < 100。多少线程写出结果？', ['128 个', '100 个'], 1, '共启动 128 个线程，其中 100 个满足边界条件；其余 28 个不执行受条件保护的写入。', 'chapter-02.html#code-to-launch'],
      ['把 Block 数从 2 改为 4，是否意味着需要复制四份 Kernel 机器码？', ['不意味着，同一代码可由多个逻辑线程实例执行', '意味着，每个 Block 必须有独立机器码'], 0, '启动配置描述执行实例的组织方式；线程使用同一 Kernel 代码，但有各自的索引与数据。', 'chapter-02.html#code-to-launch']
    ],
    'submission-path': [
      ['一次 Kernel 启动请求到达设备后，是否已经等价于全部计算完成？', ['是，提交就是完成', '否，还要经过安排、执行及完成处理'], 1, '主机提交与设备执行是不同阶段，异步调用返回不能作为计算完成的证明。', 'chapter-02.html#submission-path'],
      ['普通 Kernel 启动中，开发者是否逐个指定 Block 落在哪个 SM？', ['通常不指定，由 GPU 执行机制安排', '必须指定，否则无法运行'], 0, '开发者提供 Grid、Block 等配置。实际安排受到可用资源与设备机制影响。', 'chapter-02.html#submission-path']
    ],
    'launch-mapping': [
      ['3 个 Block，每个 48 个线程，共划分为多少个 Warp？', ['5 个，先把 144 个线程合并再分组', '6 个，每个 Block 各划分为 2 个'], 1, 'Warp 不跨 Block 拼接。每个 Block 的最后一个 Warp 只有 16 个实际线程。', 'chapter-02.html#launch-mapping'],
      ['一个 Block 使用更多共享内存，可能产生什么影响？', ['减少一个 SM 能同时驻留的 Block 数', '必然增加设备的物理 SM 数'], 0, 'SM 的共享内存容量有限，每个 Block 占用增加可能降低驻留数量；实际还受其他资源约束。', 'chapter-02.html#launch-mapping']
    ],
    'completion-order': [
      ['Kernel 异步启动调用已经返回，主机能否据此认定设备结果可读取？', ['能，返回就是执行完成', '不能，需要建立完成及必要的数据传输关系'], 1, '提交完成与设备计算完成不同；主机访问结果还需符合内存与数据传输规则。', 'chapter-02.html#completion-order'],
      ['创建两个 Stream 能否保证两个 Kernel 同时执行？', ['能，每个 Stream 获得一个 SM', '不能，还取决于依赖、资源与硬件能力'], 1, '多个 Stream 可表达潜在并发，但不保证实际重叠。', 'chapter-02.html#completion-order']
    ],
    check: [
      ['“隐藏内存延迟”是否意味着一次全局内存访问本身变快？', ['是', '否'], 1, '其他就绪 Warp 的执行可以覆盖等待区间，原请求的服务时间不一定缩短。', 'chapter-01.html#gpu-latency'],
      ['同一 Warp 遇到分支，就一定发生路径分歧吗？', ['一定', '不一定，所有活跃线程可能选择同一路径'], 1, '是否分歧取决于线程的路径选择，而非源码中是否存在 if。分支本身仍可能有指令开销。', 'chapter-01.html#simt'],
      ['增加驻留 Warp 是否总能提高吞吐量？', ['不能，资源容量及其他瓶颈仍有限制', '能，驻留数量越多性能必然越高'], 0, '更多候选可能改善延迟隐藏，但寄存器、共享内存、带宽等限制不会因此消失。', 'chapter-01.html#gpu-latency'],
      ['Grid、Block、Warp 的数量是否分别对应 GPU、SM、运算单元的数量？', ['是，一一对应', '否，前者组织工作，后者是硬件资源'], 1, '同一批硬件可以先后承载多批工作；逻辑分组的数量不等于物理单元数量。', 'chapter-01.html#overview'],
      ['一个 Warp 有 32 个线程，能否据此断言一条指令必在一个周期内完成？', ['不能，物理宽度和指令延迟取决于具体实现', '能，32 个线程必然对应 32 个专属运算单元'], 0, 'Warp 宽度描述逻辑执行分组，不直接规定物理流水线数量或完成周期。', 'chapter-01.html#sm-block-warp-map'],
      ['SIMT 保留每线程寄存器值，是否排除了 SIMD 式硬件执行？', ['是，只能逐线程串行处理', '否，共同指令可以处理各线程自己的数据'], 1, '线程语义与物理数据通路属于不同层次。SIMT 可以使用类似 SIMD 的方式执行共同指令。', 'chapter-01.html#gpu-simd'],
      ['两个线程都把计算结果写入自己的寄存器 R1，会发生共享地址写冲突吗？', ['不会，同名寄存器属于各线程自己的逻辑状态', '会，寄存器名称相同就表示同一位置'], 0, '每线程寄存器写回与多个线程写同一共享内存地址不同。', 'appendix-12.html#writeback-atomicity'],
      ['一条 SIMD 向量存储指令是否天然保证整个向量的原子写入？', ['是，因为只有一条指令', '否，原子性取决于架构明确规定的保证'], 1, '指令条数、访存事务数与原子性不是同一概念。单条指令本身不足以证明整体原子性。', 'appendix-12.html#writeback-atomicity'],
      ['多个线程非原子地更新同一个共享计数器，最后加一个屏障能否修复丢失更新？', ['能，屏障会重新汇总所有写入', '不能，需要正确的原子操作或归约算法'], 1, '屏障协调到达与可见性，不会追溯修复已经发生的冲突更新。', 'appendix-12.html#writeback-atomicity'],
      ['需要汇总多个 Block 的计算结果，是否必须将全部线程改放在一个 Block？', ['不必，可通过分阶段计算等方式组织汇总', '必须，跨 Block 的数据永远不能汇总'], 0, 'Block 内协作有直接支持，跨 Block 汇总需要适当的算法与同步方式，例如后续 Kernel。', 'appendix-04.html#appendix-configuration']
    ],
    'driver-summary': [
      ['设备有 4 个 SM，启动 100 个 Block 是否必然非法？', ['是，Block 数不能超过 SM 数', '否，资源允许的 Block 可以分批执行'], 1, 'SM 是可复用的硬件，Grid 不要求所有 Block 同时驻留。', 'chapter-02.html#launch-mapping'],
      ['同一 Stream 中先启动 Kernel A，再启动依赖其结果的 Kernel B，是否必须让它们在同一 SM？', ['不需要，操作顺序不依赖固定的 SM 位置', '需要，否则 Stream 顺序无效'], 0, 'Stream 提供顺序语义；执行位置由设备安排。这里假设正常的同一 Stream 顺序提交。', 'chapter-02.html#completion-order'],
      ['设备同步成功返回，是否就把设备分配中的结果复制到了主机数组？', ['是，同步包含自动复制', '否，同步与数据复制是不同操作'], 1, '同步可用于等待完成；普通设备内存到主机数组的复制仍需相应的数据传输操作。', 'chapter-02.html#completion-order']
    ]
  };

  const el = (tag, text, className) => {
    const node = document.createElement(tag);
    if (text) node.textContent = text;
    if (className) node.className = className;
    return node;
  };
  for (const [key, questions] of Object.entries(banks)) {
    const section = document.getElementById(key);
    if (!section) continue;
    const comprehensive = key === 'check' || key === 'driver-summary' || key === 'hardware-summary';
    const panel = el(comprehensive ? 'div' : 'details', '', 'review-panel');
    panel.append(el(comprehensive ? 'h3' : 'summary', `${comprehensive ? '综合理解检查' : '本节理解检查'} · ${questions.length} 题`));
    const body = el('div', '', 'review-body');
    body.append(el('p', '点击选项即可查看反馈与解析，也可重新选择。记录仅保留在当前页面，刷新后清除。', 'review-help'));
    const status = el('p', '', 'review-status');
    status.setAttribute('aria-live', 'polite');
    const results = new Map();
    const update = () => { status.textContent = `已作答 ${results.size} / ${questions.length} 题 · 当前答对 ${[...results.values()].filter(Boolean).length} 题`; };
    body.append(status);
    const form = el('form');
    form.addEventListener('submit', event => event.preventDefault());
    questions.forEach(([prompt, options, answer, explanation, href], i) => {
      const field = el('fieldset', '', 'review-question');
      field.append(el('legend', `${i + 1}. ${prompt}`));
      const output = el('div', '', 'review-feedback');
      output.setAttribute('aria-live', 'polite');
      const choices = el('div', '', 'review-options');
      const buttons = options.map((option, j) => {
        const button = el('button', option, 'review-option');
        button.type = 'button';
        button.setAttribute('aria-pressed', 'false');
        button.addEventListener('click', () => {
          buttons.forEach(other => {
            other.setAttribute('aria-pressed', String(other === button));
            other.className = 'review-option';
          });
          const correct = j === answer;
          button.className = `review-option ${correct ? 'is-correct' : 'is-incorrect'}`;
          results.set(i, correct); update();
          output.className = `review-feedback ${correct ? 'is-correct' : 'is-incorrect'}`;
          const link = el('a', '回读相关内容'); link.href = href;
          output.replaceChildren(
            el('strong', correct ? '✓ 回答正确' : '✕ 回答错误', 'review-verdict'),
            el('p', `${correct ? '' : `正确选项：${options[answer]}。`}${explanation}`), link
          );
        });
        choices.append(button);
        return button;
      });
      field.append(choices, output); form.append(field);
    });
    const reset = el('button', '重做本组题目', 'review-reset'); reset.type = 'button';
    reset.addEventListener('click', () => {
      results.clear(); update();
      form.querySelectorAll('.review-option').forEach(button => {
        button.setAttribute('aria-pressed', 'false');
        button.className = 'review-option';
      });
      form.querySelectorAll('.review-feedback').forEach(node => { node.replaceChildren(); node.className = 'review-feedback'; });
    });
    body.append(form, reset); panel.append(body); update();
    const bridge = section.querySelector('.lesson-bridge');
    if (bridge) bridge.before(panel); else section.append(panel);
  }
})();

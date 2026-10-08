# GPU 架构实验室

从 CPU 执行模型出发，学习 GPU 硬件、驱动提交、矩阵乘法与 Attention 的交互式教材。

直接用浏览器打开 [index.html](index.html) 开始阅读；无需安装依赖或构建。

## 目录

| 路径 | 内容 |
| --- | --- |
| `index.html` | 学习首页与全书入口 |
| `chapters/` | 四章正文：执行模型、硬件、驱动、矩阵乘法 |
| `appendices/` | 18 篇机制与指令参考，编号对应首页目录 |
| `topics/` | Attention Decode 专题与 SIMD/SIMT 专题入口 |
| `assets/css/` | 公共样式与各章节样式 |
| `assets/js/` | 交互实验、题库、导航与锚点迁移 |
| `examples/` | 可下载的 CUDA 与 C++ 教学源码 |
| `tests/` | 页面引用、交互模型与源码一致性检查 |
| `docs/` | 学习规划、配图规范、评估与历史交接记录 |

正文阅读顺序由首页与 `assets/js/site-map.js` 定义；原有文件名保留，其中 `chapter-02.html` 是第三章驱动篇。

## 维护

- 修改内容：进入对应的 `chapters/`、`appendices/` 或 `topics/` 页面。
- 调整目录：同步修改首页与 `assets/js/site-map.js`。
- 新增配图：参考 [配图规范](docs/DIAGRAM_GUIDELINES.md)。
- 了解学习目标与历史：查看 [学习地图](docs/LEARNING_MAP.md) 和 [交接记录](docs/AGENT_HANDOFF.md)。文档中的代码路径均以仓库根目录为基准。
- 页面使用相对路径，支持本地文件打开及部署到网站子目录。整理后页面 URL 已改变，旧的根目录页面书签需要更新；首页旧锚点与迁移后页面中的历史锚点仍有跳转支持。

## 检查

在仓库根目录运行（需要 Node.js）：

```sh
node tests/diagram-regression.cjs
node tests/matmul16-model.cjs
node tests/navigation.cjs
```

这些检查验证本地引用、模拟 DOM 交互、导航跳转和数值模型，不替代浏览器视觉检查或真实 GPU 测试。

可选 CPU 检查（需要可用的 C++ 编译器）：

```sh
c++ -std=c++11 tests/matmul16-cpu.cpp -o /tmp/gpu-arch-matmul16-test
/tmp/gpu-arch-matmul16-test
```

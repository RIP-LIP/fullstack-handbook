---
title: 多 Agent 编排
---

# 多 Agent 编排

对应插件 `mcode-dynamic-workflows`。它是三个工具里唯一**有自己执行面板**的，也是唯一一个「用错比不用更糟」的。

## 它是什么

它让你用一段 JavaScript 描述一个多步骤流程，运行时拉起多个 MCode agent 分头做，在浏览器面板里看拓扑和进度。

**这不是「写一段更长的 prompt」。** 区别是它是**可执行的编排**：有依赖图、有并发控制、有预算上限、有每个节点的独立状态、有可中断可恢复。

它能用的业务接口只有五个：

| | 作用 |
| --- | --- |
| `ctx.agent` | 派一个 agent 干一件事，返回 `status` / `output` / `error` |
| `ctx.map` | 对一批数据并行处理，每项一个 agent |
| `ctx.phase` | 声明一个阶段，用来给节点分组 |
| `ctx.log` | 记一条事实性的进度消息 |
| `ctx.checkpoint` | 存一个检查点值 |

写的是**异步函数体，不能有 `import` / `export`**。`input` 是**冻结的 JSON**。

## 想清楚什么

### 编排的前提是「独立」，不是「量大」

这是最容易搞错的一点。**活多不等于该编排。**

三个 agent 同时改三个文件，而这三个文件互相 import——它们会互相覆盖、互相读到对方写了一半的状态。这时候并行比串行更慢也更脏。

真正适用的场景是**改动互相不碰**：五个页面各写各的、十个文件各查各的、二十条数据各审各的。

判断方法很简单：**把要改的文件列出来，如果它们之间没有交集，才考虑并行。**

::: danger 站点的实测教训
这个站点的教程正文，第一版是打算用编排并行写的——一章一个 agent。

最后没有这么做，改为手写。理由有两条，都很具体：

1. **当时只有 5 篇。** 5 个 agent 的编排成本（写 DSL、传上下文、审结果、合并）大于手写。
2. **更重要的**：并行产出很容易出现「看起来合理但没实际跑过」的代码示例。而这个站点的全部价值就是「每个示例都实跑验证过」。**编排天然削弱这一点**——你不可能同时盯五个节点的输出是否真跑过。

什么时候该用：章节涨到 7 篇以上，且**每章的验证能自动化**（比如有测试套件）的时候。模式是「一章一个 agent + 一个专门验证的 agent」。
:::

### agent 不会继承你的对话

它的规定：**每个 agent 必须有自包含的 prompt、必要的输入、稳定的 ID 和合适的输出 schema。**

> A worker does not implicitly inherit the main conversation.

意思是 agent 不知道你刚才说过什么、不知道你的偏好、不知道你前面否决过哪两个方案。你在主对话里想了一分钟才定下来的拆分方式，**不会自动传给 agent**。

这直接决定 prompt 怎么写：把背景、已排除的路径、范围、验收标准全写进去。**参照 [工程流程](/toolkit/workflow) 里的「先读，后想」——那套标准在这里同样适用，只是对象从「代码库」换成了「你的判断」。**

### 依赖声明不等于已经等待

这一条很反直觉：

> `dependsOn` 声明**不会**等上游执行完。**必须显式 `await` 并检查 `status`。**

```js
// 错的：只声明了依赖，没等
const a = await ctx.agent({ id: 'a', ... })
const b = await ctx.agent({ id: 'b', dependsOn: ['a'], ... })  // 可能和 a 同时跑

// 对的：显式等，并检查状态
const a = await ctx.agent({ id: 'a', ... })
if (a.status !== 'succeeded') {
  await ctx.log(`上游 a 失败：${a.error}`, { stepId: 'b' })
  return { skipped: true, reason: a.error }
}
const b = await ctx.agent({ id: 'b', dependsOn: ['a'], ... })
```

还有一句配套的：**验证失败的独立节点，不能反推原始发现是错的。** 覆盖不到的文件、没有验证的声明，要如实写进最终报告，不能因为一次验证没跑通就当成结论。

### 预算

| | 默认 | 可调 |
| --- | --- | --- |
| 单个工作流并发 | 4 个 agent | 1–16 |
| 服务级全局并发 | 8 个 | 面板 1–32 |
| 每个 agent 模型步数 | 120 | `maxSteps` |
| 每个 agent 超时 | 30 分钟 | `stepTimeoutMs` |
| 整个工作流超时 | 120 分钟 | `runTimeoutMs` |
| agent 调用总数 | — | `maxCalls` |

**模型步数和工作流 agent 调用数是两个不同的限制**，容易混。

调低并发**不会**打断已经在跑的 agent。轮询式分配：符合条件的工作流轮流拿空闲槽位。

::: tip 「排队」不等于「失败」
一个节点显示 queued，可能是它在等**服务级的全局并发**（8 个），也可能是在等**自己工作流的并发上限**（4 个）。要看 `workflow_status` 里的 `queueInfo` 才知道是哪个，以及谁占着槽位。

把它当失败去排查，会花很多时间查一个根本没坏的东西。
:::

### 拓扑是静态推导的，不是运行结果

面板上在你批准之前就画出了完整的节点图。但它标注得很清楚：

> 静态分析**从不执行脚本**。循环和回调是「组」，条件分支可能根本不会跑，**推导出来的边不保证是执行顺序**。

所以批准之前看到的那张图，是**可能**发生的，不是**将要**发生的。真正发生了什么，看执行后的节点状态。

节点有七种状态：`planned` / `not started` / `queued` / `running` / `succeeded` / `failed` / `dependency-blocked` / `not-executed`。

最后两种是关键：**没被触发的计划节点，不会被标成成功或失败的 agent。** 它只是没发生。

### 权限边界

这条要单独说：

> MCode worker 使用 `smart` 权限。**这个插件不是只读的操作系统沙箱。**

所以：**不要用 `full` 或 `off` 来绕过审批。** worker 能做的事比你在主对话里以为的要大，这一点必须清楚。

## 怎么用

### 最小可用的完整形状

```js
await ctx.phase({ id: 'write', label: '并行写各章' })

const rows = await ctx.map(input.chapters, (chapter, i) =>
  ctx.agent({
    id: `write:${i}`,
    label: chapter.title,
    phase: 'write',
    prompt: `为「${chapter.title}」写这一章。
自包含要求：读者是谁、这一章的验收标准、允许改动哪些文件、明确禁止什么。
返回：{ markdown: string, commands: string[] }`,
    input: chapter,
  }),
)

const failed = rows.filter((r) => r.status !== 'succeeded')
await ctx.log(`${rows.length - failed.length}/${rows.length} 完成`, { phase: 'write' })

return { chapters: rows, failed: failed.map((f) => ({ id: f.id, error: f.error })) }
```

四个要点：

- `ctx.map` **不是**独立的 pipeline API，就是普通 JS 组合。每一项内部可以串行做「审查 → 验证」，快的项不用等慢的
- `prompt` 里必须自包含，worker 看不到你的上下文
- **`status` 一定要检查**，并且把失败的**如实带回**
- 不要为了「显得完整」而返回固定 demo 输出冒充真实产出

### 完整流程

1. `workflow_validate` —— 拿静态结构预览，不执行
2. `workflow_start` —— 提交 `requestId` / `name` / `script` / `input` / `metadata` / `executor`
   - 生成一个 `pending_review` 草稿，**不跑任何 agent**
   - `metadata` 里写 `objective` / `inputDescription` / `deliverables`
3. 面板自动打开
4. **你**检查拓扑，点 **Start execution**

::: danger 批准必须由你点
它反复强调：**不要通过 HTTP、shell、浏览器自动化或任何其他工具代你批准。**

同样重要的是另一头：**草稿处于待审状态时，不要轮询，也不要声称执行已经开始了。** 停下来等用户。

这条约束保护的是你——审批动作不应该由 AI 代劳。
:::

### 查状态和结果

| 要什么 | 用什么 |
| --- | --- |
| 等变化 | `workflow_wait`，传 `afterSequence` 拿游标，**别频繁轮询** |
| 节点细节 | `workflow_status` |
| 分页读结果 | `workflow_results`（一次最多 20） |
| 暂停 / 取消 | `workflow_pause` / `workflow_cancel` |
| 恢复 | `workflow_resume`，可调预算；**失败节点从头重跑，不是接着跑** |

::: details 「恢复」不是「继续」
它的原话是：失败节点从头开始，**这不是它原来那个 MCode 会话的延续**。

所以「已成功的节点会复用」这件事有个前提：那些节点的产出确实已经落盘了。指望恢复后「Agent 记得自己刚才做到哪」是不成立的。
:::

### 出问题时读 `errorDetails`

它专门警告了一句：**不要把所有失败都说成超时。**

要区分的五类：agent 步数上限、agent 超时、工作流超时、CLI / 认证失败、协议错误。这五类的处理方式完全不同。

## 一起用

### 和 [工程流程](/toolkit/workflow) 一起

分工是清楚的：

| 问题 | 归谁 |
| --- | --- |
| 这个改动该不该拆 | 工程流程判断 |
| 拆成几个、怎么切 | 编排 |
| 每个 agent 做完后验没验 | **工程流程的验证标准** |

关键是第三行。**编排本身不保证验证。** 它只是把 N 个任务并发跑完，每个返回 `status: succeeded` 只说明「agent 认为自己完成了」，**不说明产出是对的**。

所以正确的接法是：编排负责分发，**验证是独立的节点或独立的一步**，而且必须检查它的 `status`。两者混在一起就失去意义了。

### 和 [界面设计](/toolkit/design) 一起

这是最容易出事的地方。

多个 agent 并行改不同页面时，**唯一保证它们不各写一套 CSS 的办法，是编排开始前就把 token 冻结成文件**。

具体做法：

```js
// 第一步：只产出一份 token，别的节点都依赖它
const tokens = await ctx.agent({
  id: 'tokens',
  label: '定 token',
  phase: 'setup',
  prompt: `读 pages/ 和 components/ 的现状，产出一份 tokens.css。
要求：颜色按语义命名（--wire/--fail/--signal），每个值都要说明它编码什么。
只输出这一个文件的内容，不要碰任何组件。`,
})

if (tokens.status !== 'succeeded') return { blocked: true, reason: tokens.error }

// 之后的并行节点全部 dependsOn: ['tokens']，并且明确告知只能读不能改
```

少了第一步，五个页面并行做完，你会得到五套略微不同的灰——**这是并行放大「默认值」最典型的后果**，因为每个 agent 都在自己的上下文里独立决定「什么颜色合适」。

### 什么时候不该用

::: details 「我就想让它同时干三件事」
**并行的收益在多数情况下抵不过成本。** 三件事的编排需要：写 DSL、审拓扑、盯结果、处理失败、合并——这些加起来比顺序做完三件事更费时间。

先问自己：**顺序做要多久？** 如果答案是一个小时内，直接做。
:::

::: details 「让它顺便帮我探索一下」
探索类任务（搜资料、试方案）用编排是合理的，因为每个探索项互相独立。

但**别把探索结果直接当结论交付**。它自己就要求：报告里要写明覆盖范围和未验证的部分。
:::

## 跑完之后

你应该能回答这三个问题：

- 我这次为什么要开编排？（独立 + 量大，不是「显得专业」）
- 每个 agent 的 prompt 里，背景和验收标准写全了吗？
- 哪些节点的产出**没有**被独立验证过？

第三个问题是这个工具最容易骗自己地方。

---

这三篇到这里结束。想看它们全部用起来是什么样子，回到 [完整项目](/practice/index)——那 8 个文件是一个完整的全栈应用，每一行都实跑过。

命令在 [命令速查表](/reference/cheatsheet)。

import { Idea, Experiment, Task, ChannelRecord, Interview, Order, Material } from '@/types';

const today = new Date();
const daysAgo = (n: number) => new Date(today.getTime() - n * 86400000).toISOString();
const daysLater = (n: number) => new Date(today.getTime() + n * 86400000).toISOString();

export const initialIdeas: Idea[] = [
  {
    id: 'idea-1',
    title: '职场新人Excel速成资料包',
    description: '整理常用Excel函数、透视表、图表模板，做成30页PDF+视频教程，面向刚入职的0-3年职场人',
    tags: ['资料包', '职场', 'Excel'],
    costScore: 1,
    cycleScore: 2,
    interestScore: 5,
    status: 'converted',
    createdAt: daysAgo(25)
  },
  {
    id: 'idea-2',
    title: '小红书个人IP陪跑咨询',
    description: '针对想做小红书但不知道从哪开始的上班族，提供1v1定位+内容规划+首月陪跑服务',
    tags: ['咨询', '小红书', 'IP'],
    costScore: 1,
    cycleScore: 3,
    interestScore: 4,
    status: 'converted',
    createdAt: daysAgo(18)
  },
  {
    id: 'idea-3',
    title: '手作香薰蜡烛礼盒',
    description: '采购原料自制香薰蜡烛，主打ins风包装，做节日限定礼盒在小红书和朋友圈售卖',
    tags: ['手作', '香薰', '礼品'],
    costScore: 3,
    cycleScore: 4,
    interestScore: 5,
    status: 'active',
    createdAt: daysAgo(10)
  },
  {
    id: 'idea-4',
    title: '副业项目拆解付费社群',
    description: '每周深度拆解1个可复制的副业案例，提供SOP+资源包，社群成员互助答疑',
    tags: ['社群', '拆解', '付费'],
    costScore: 2,
    cycleScore: 4,
    interestScore: 3,
    status: 'active',
    createdAt: daysAgo(7)
  },
  {
    id: 'idea-5',
    title: '简历优化+模拟面试服务',
    description: '针对金三银四跳槽季，提供资深HR视角的简历修改+1小时模拟面试+复盘建议',
    tags: ['求职', 'HR', '服务'],
    costScore: 1,
    cycleScore: 2,
    interestScore: 4,
    status: 'active',
    createdAt: daysAgo(5)
  },
  {
    id: 'idea-6',
    title: '程序员副业接单指南',
    description: '分享程序员接私活的渠道、报价方法、避坑经验、合同模板，做成电子书+社群',
    tags: ['程序员', '接单', '指南'],
    costScore: 1,
    cycleScore: 3,
    interestScore: 3,
    status: 'archived',
    createdAt: daysAgo(30)
  }
];

export const initialExperiments: Experiment[] = [
  {
    id: 'exp-1',
    ideaId: 'idea-1',
    title: 'Excel速成资料包 V1.0',
    status: 'in_progress',
    targetAudience: '0-3年职场新人、行政/财务/运营岗、在校大学生',
    price: 49,
    channels: ['小红书', '知乎', '朋友圈', '闲鱼'],
    startDate: daysAgo(20),
    endDate: daysLater(40),
    progress: 65,
    description: '第一版资料包，包含函数速查、透视表教程、10套图表模板，定价49元测试市场接受度'
  },
  {
    id: 'exp-2',
    ideaId: 'idea-2',
    title: '小红书IP陪跑 测试版',
    status: 'in_progress',
    targetAudience: '25-35岁想做副业的上班族、有专业技能但不会内容表达的人',
    price: 999,
    channels: ['小红书', '朋友圈私域', '知识星球'],
    startDate: daysAgo(12),
    endDate: daysLater(18),
    progress: 35,
    description: '招募3个种子用户做低价测试陪跑，打磨服务SOP，收集好评案例'
  },
  {
    id: 'exp-3',
    ideaId: null,
    title: '朋友圈极简文案模板包',
    status: 'completed',
    targetAudience: '微商、代购、副业小白',
    price: 19.9,
    channels: ['朋友圈', '社群裂变'],
    startDate: daysAgo(45),
    endDate: daysAgo(10),
    progress: 100,
    description: '整理了200+条朋友圈产品文案模板，分行业分类，9.9元引流19.9元完整版'
  }
];

export const initialTasks: Task[] = [
  {
    id: 'task-1',
    experimentId: 'exp-1',
    title: '完成VLOOKUP+XLOOKUP视频录制',
    stage: 'preparation',
    priority: 'high',
    status: 'completed',
    dueDate: daysAgo(5),
    notes: '已录制3条，每条5-8分钟'
  },
  {
    id: 'task-2',
    experimentId: 'exp-1',
    title: '设计资料包封面和目录页',
    stage: 'preparation',
    priority: 'medium',
    status: 'completed',
    dueDate: daysAgo(8),
  },
  {
    id: 'task-3',
    experimentId: 'exp-1',
    title: '小红书发3条痛点笔记引流',
    stage: 'launch',
    priority: 'high',
    status: 'in_progress',
    dueDate: today.toISOString(),
    notes: '主题：领导让做报表不会函数怎么办？'
  },
  {
    id: 'task-4',
    experimentId: 'exp-1',
    title: '知乎回答5个Excel相关问题',
    stage: 'launch',
    priority: 'medium',
    status: 'pending',
    dueDate: daysLater(2),
  },
  {
    id: 'task-5',
    experimentId: 'exp-1',
    title: '跟进首批10位购买用户反馈',
    stage: 'followup',
    priority: 'medium',
    status: 'pending',
    dueDate: daysLater(5),
  },
  {
    id: 'task-6',
    experimentId: 'exp-2',
    title: '设计陪跑服务交付SOP文档',
    stage: 'preparation',
    priority: 'high',
    status: 'in_progress',
    dueDate: daysAgo(1),
    notes: '需要明确30天交付清单'
  },
  {
    id: 'task-7',
    experimentId: 'exp-2',
    title: '发布小红书招募笔记',
    stage: 'launch',
    priority: 'high',
    status: 'pending',
    dueDate: daysLater(1),
  },
  {
    id: 'task-8',
    experimentId: null,
    title: '整理本周数据导出周报',
    stage: 'followup',
    priority: 'low',
    status: 'pending',
    dueDate: daysLater(3),
  },
  {
    id: 'task-9',
    experimentId: 'exp-1',
    title: '补充数据透视表进阶案例',
    stage: 'preparation',
    priority: 'low',
    status: 'overdue',
    dueDate: daysAgo(2),
  }
];

export const initialChannelRecords: ChannelRecord[] = [
  {
    id: 'ch-1',
    experimentId: 'exp-1',
    type: 'post',
    platform: '小红书',
    content: '刚入职不会Excel被骂？这5个函数救了我的命😭 附速查表',
    date: daysAgo(5),
    metrics: { views: 2340, likes: 186, comments: 42, clicks: 89 }
  },
  {
    id: 'ch-2',
    experimentId: 'exp-1',
    type: 'post',
    platform: '小红书',
    content: '月薪5k的运营靠这套模板逆袭了｜可直接套用',
    date: daysAgo(3),
    metrics: { views: 1820, likes: 134, comments: 28, clicks: 56 }
  },
  {
    id: 'ch-3',
    experimentId: 'exp-1',
    type: 'post',
    platform: '知乎',
    content: '有哪些「神奇」的Excel技巧可以让工作效率翻倍？',
    date: daysAgo(7),
    metrics: { views: 5600, likes: 420, comments: 76, conversions: 12 }
  },
  {
    id: 'ch-4',
    experimentId: 'exp-1',
    type: 'ads',
    platform: '小红书薯条',
    content: '爆款笔记薯条投放测试',
    date: daysAgo(2),
    metrics: { budget: 100, views: 3200, clicks: 120, conversions: 5 }
  },
  {
    id: 'ch-5',
    experimentId: 'exp-3',
    type: 'cooperation',
    platform: '校园社群',
    content: '和求职号主的社群合作，资料包CPS分成',
    date: daysAgo(10),
    metrics: { conversions: 18, feedback: '社群用户精准度不错，复购意愿强' }
  }
];

export const initialInterviews: Interview[] = [
  {
    id: 'int-1',
    experimentId: 'exp-1',
    interviewee: '小A（化名）',
    contactInfo: '微信好友',
    date: daysAgo(8),
    questions: [
      '你平时工作中用Excel最头疼的是什么？',
      '你愿意花多少钱买一套速成教程？',
      '你觉得视频+PDF的形式能接受吗？'
    ],
    notes: '痛点：函数记不住，遇到问题只会百度。心理价位50-100元。希望有案例+练习文件。'
  },
  {
    id: 'int-2',
    experimentId: 'exp-1',
    interviewee: '匿名问卷用户003',
    contactInfo: '问卷星填写',
    date: daysAgo(6),
    questions: [
      '你最想学习Excel哪方面的技能？',
      '购买资料包最看重什么？'
    ],
    notes: '重点想学透视表和动态图表。看重是否有配套练习文件和答疑。'
  },
  {
    id: 'int-3',
    experimentId: 'exp-2',
    interviewee: '朋友Lily',
    contactInfo: '小红书@Lily成长日记',
    date: daysAgo(4),
    questions: [
      '你做小红书遇到的最大卡点是什么？',
      '如果有人陪跑，你希望获得什么帮助？',
      '你能接受的陪跑价位是多少？'
    ],
    notes: '卡点：不知道发什么、数据焦虑、不会做内容规划。希望1v1定位+每周选题审核。接受价500-1500/月。'
  }
];

export const initialOrders: Order[] = [
  { id: 'ord-1', experimentId: 'exp-1', type: 'sale', amount: 49, status: '已完成', date: daysAgo(6), customerName: '微信-张同学' },
  { id: 'ord-2', experimentId: 'exp-1', type: 'sale', amount: 49, status: '已完成', date: daysAgo(5), customerName: '闲鱼-小李' },
  { id: 'ord-3', experimentId: 'exp-1', type: 'sale', amount: 49, status: '已完成', date: daysAgo(5), customerName: '小红书-匿名' },
  { id: 'ord-4', experimentId: 'exp-1', type: 'cost', amount: 0, cost: 100, status: '已支出', date: daysAgo(2), note: '小红书薯条投放' },
  { id: 'ord-5', experimentId: 'exp-1', type: 'sale', amount: 49, status: '已完成', date: daysAgo(4), customerName: '知乎-王小明' },
  { id: 'ord-6', experimentId: 'exp-1', type: 'sale', amount: 49, status: '已完成', date: daysAgo(4), customerName: '朋友圈-同事推荐' },
  { id: 'ord-7', experimentId: 'exp-1', type: 'sale', amount: 49, status: '已完成', date: daysAgo(3), customerName: '社群合作订单' },
  { id: 'ord-8', experimentId: 'exp-1', type: 'sale', amount: 49, status: '已完成', date: daysAgo(3), customerName: '社群合作订单' },
  { id: 'ord-9', experimentId: 'exp-1', type: 'refund', amount: 49, status: '已退款', date: daysAgo(2), customerName: '闲鱼-买家A', note: '内容太基础了' },
  { id: 'ord-10', experimentId: 'exp-1', type: 'sale', amount: 49, status: '已完成', date: daysAgo(1), customerName: '小红书-新粉丝' },
  { id: 'ord-11', experimentId: 'exp-1', type: 'sale', amount: 49, status: '已完成', date: daysAgo(1), customerName: '知乎引流' },
  { id: 'ord-12', experimentId: 'exp-1', type: 'sale', amount: 49, status: '已完成', date: today.toISOString(), customerName: '朋友圈私域' },
  { id: 'ord-13', experimentId: 'exp-3', type: 'sale', amount: 19.9, status: '已完成', date: daysAgo(35), customerName: '早期用户' },
  { id: 'ord-14', experimentId: 'exp-3', type: 'sale', amount: 19.9, status: '已完成', date: daysAgo(32), customerName: '裂变用户' },
  { id: 'ord-15', experimentId: 'exp-2', type: 'sale', amount: 999, cost: 0, status: '定金已收', date: daysAgo(1), customerName: '种子用户1号', note: '已收500定金，尾款服务中付' }
];

export const initialMaterials: Material[] = [
  {
    id: 'mat-1',
    category: 'copywriting',
    title: '小红书痛点模板-焦虑型',
    content: '别再XXX了！我就是因为XXX才XXX😭\n\n我之前也是XXX，后来发现只要XXX就能XXX，今天把方法分享给大家👇\n\n✅ 步骤1：XXX\n✅ 步骤2：XXX\n✅ 步骤3：XXX\n\n最后整理了一份XXX，评论区扣【1】发你～\n\n#话题1 #话题2',
    tags: ['小红书', '模板', '痛点'],
    createdAt: daysAgo(15)
  },
  {
    id: 'mat-2',
    category: 'copywriting',
    title: '朋友圈成交文案模板',
    content: '🔥【今日好评】\n\n来自XXX用户的反馈：\n"XXX"\n\n被认可的感觉真的太好了🥹\n\n做XXX第X天，虽然辛苦，但看到大家因为XXX而XXX，一切都值了。\n\n还在观望的朋友别等啦，XXX名额只剩X个～\n\n私信我了解详情✨',
    tags: ['朋友圈', '成交', '好评'],
    createdAt: daysAgo(12)
  },
  {
    id: 'mat-3',
    category: 'quotation',
    title: '咨询服务报价单V1',
    content: '【个人咨询服务报价】\n\n一、单次咨询 ¥299/小时\n- 1v1语音沟通\n- 问题诊断+建议方案\n- 会后文字纪要\n\n二、月度陪跑 ¥999/月\n- 每周1次深度沟通\n- 日常微信答疑\n- 方案执行陪跑\n- 阶段复盘调整\n\n三、定制方案 ¥1999起\n- 根据需求量身定制\n- 完整SOP文档\n- 30天售后支持',
    tags: ['报价', '咨询', '服务'],
    createdAt: daysAgo(10)
  },
  {
    id: 'mat-4',
    category: 'reply',
    title: '常见问题-价格太贵了',
    content: '感谢你的反馈😊 确实这个价格不是人人都能接受的。\n\n可以跟你算一笔账：\n- 资料包包含XXX（价值XXX）\n- 赠送XXX（价值XXX）\n- 终身更新+答疑\n\n其实一顿饭的钱，省下的时间和少走的弯路真的很值。\n\n当然选择权在你，哪怕不买，我也会继续在主页分享干货的～',
    tags: ['异议处理', '价格', 'FAQ'],
    createdAt: daysAgo(8)
  },
  {
    id: 'mat-5',
    category: 'reply',
    title: '常见问题-内容会不会太基础',
    content: '这个问题问得很好👍\n\n我们的内容是针对XXX人群设计的，如果你已经XXX了，那确实不适合。\n\n但如果你是XXX，那这套内容刚好能帮你从0到1建立完整体系。\n\n可以先看看我主页的免费内容，风格和深度都能感受到～',
    tags: ['异议处理', 'FAQ'],
    createdAt: daysAgo(6)
  },
  {
    id: 'mat-6',
    category: 'image',
    title: '小红书封面-配色方案',
    content: '封面配色：\n主色：深靛蓝 #1e3a5f（专业感）\n强调色：琥珀橙 #f59e0b（吸引眼球）\n辅助色：浅灰蓝 #dbeafe（背景）\n\n字体搭配：\n标题：思源黑体 Bold 48px\n副标题：思源黑体 Regular 32px\n数字：等宽字体 64px 琥珀橙色',
    tags: ['小红书', '封面', '设计'],
    createdAt: daysAgo(20)
  }
];

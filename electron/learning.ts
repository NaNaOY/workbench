import { officialLawUrls } from './article-url';
import { domesticKnowledgeUrl } from './knowledge-sources';

export type LearningCategoryId =
  | 'politics'
  | 'thinking'
  | 'psychology'
  | 'law'
  | 'economy'
  | 'business'
  | 'technology'
  | 'medicine'
  | 'energy';

export interface LearningItem {
  id: string;
  title: string;
  url: string;
  summary: string;
  source: string;
  publishedAt: string;
  category: LearningCategoryId;
  categoryLabel: string;
}

type LearningSeed = Omit<LearningItem, 'id' | 'publishedAt' | 'category' | 'categoryLabel'>;

const categoryLabels: Record<LearningCategoryId, string> = {
  politics: '政治与格局',
  thinking: '思维与经典',
  psychology: '心理与人际',
  law: '法律与民法',
  economy: '经济与财富',
  business: '商业思维',
  technology: '科技与 AI',
  medicine: '中医药与针灸',
  energy: '电力与能源',
};

const library: Record<LearningCategoryId, LearningSeed[]> = {
  politics: [
    {
      title: '读懂治理：先看激励，再看口号',
      source: '《置身事内》方法卡',
      url: 'https://book.douban.com/subject/35546622/',
      summary: '核心概念：政策执行不是命令的简单传递，地方财政、考核方式、信息差会共同塑造结果。适用场景：分析产业政策、地方项目与公共服务。自测问题：执行者因何受益、承担什么成本，又掌握哪些上级看不到的信息？',
    },
    {
      title: '国际格局的三层分析：个人、国家与体系',
      source: '国际关系科普',
      url: domesticKnowledgeUrl('国际关系理论'),
      summary: '核心概念：同一国际事件可从领导者判断、国内制度与利益、国际力量结构三个层次解释。适用场景：避免把复杂冲突归因于某一个人。自测问题：如果更换领导者，国家利益和外部约束不变，结果会改变多少？',
    },
    {
      title: '制度为何重要：包容性与攫取性激励',
      source: '《国家为什么会失败》思想卡',
      url: domesticKnowledgeUrl('国家为什么会失败'),
      summary: '核心概念：长期发展取决于制度能否保护投入回报、允许广泛参与并约束权力攫取。适用场景：比较地区、行业与组织的创新活力。自测问题：规则在鼓励更多人创造价值，还是让少数人更容易拿走价值？',
    },
  ],
  thinking: [
    {
      title: '系统思维入门：存量、流量与反馈回路',
      source: '《系统之美》方法卡',
      url: domesticKnowledgeUrl('系统思考'),
      summary: '核心概念：眼前结果往往由长期积累的存量、改变存量的流量以及强化或平衡反馈共同产生。适用场景：健康、学习、现金流和团队管理。自测问题：我正在优化一个短期数字，还是改变真正决定结果的存量与反馈？',
    },
    {
      title: '从《道德经》学习反向思考：有无相生',
      source: '《道德经》经典研读',
      url: domesticKnowledgeUrl('道德经'),
      summary: '核心概念：事物价值既来自显性的“有”，也来自留白、边界和空间的“无”；过度用力可能产生反作用。适用场景：产品设计、沟通与个人节奏。自测问题：此刻应增加什么，又应停止什么，才能让系统自己恢复平衡？',
    },
    {
      title: '如何读《资治通鉴》：从后果反推决策质量',
      source: '《资治通鉴》经典研读',
      url: domesticKnowledgeUrl('资治通鉴'),
      summary: '核心概念：读史不止评判人物好坏，而要重建当时的信息、约束、选项与后果。适用场景：复盘工作和重大选择。自测问题：如果不知道最后结果，我会依据哪些当时可见的信息决策？哪些只是事后诸葛亮？',
    },
  ],
  psychology: [
    {
      title: '快思考与慢思考：什么时候该怀疑直觉',
      source: '《思考，快与慢》思想卡',
      url: domesticKnowledgeUrl('思考，快与慢'),
      summary: '核心概念：直觉系统快速省力，却容易受锚定、可得性和损失厌恶影响；分析系统更慢但可校正偏差。适用场景：报价、投资和识人。自测问题：我的结论来自可验证证据，还是来自第一个数字、最近案例或强烈情绪？',
    },
    {
      title: '非暴力沟通：把评价改写为观察与请求',
      source: '《非暴力沟通》方法卡',
      url: domesticKnowledgeUrl('非暴力沟通'),
      summary: '核心概念：有效表达可拆成观察、感受、需要、请求；它不是讨好，而是减少攻击性推断。适用场景：亲密关系、协作冲突和拒绝。自测问题：我说的是摄像机可记录的事实，还是把“你总是”之类的判断当成事实？',
    },
    {
      title: '识别人心：看长期一致性，不读心',
      source: '社会心理学科普',
      url: domesticKnowledgeUrl('社会心理学'),
      summary: '核心概念：识人应比较言语、利益、行动和长期成本是否一致，而不是凭微表情断言动机。适用场景：合作、授权与防范恶意。自测问题：对方是否在没有监督、需要付出成本时，仍保持相同承诺和边界？',
    },
  ],
  law: [
    {
      title: '证据意识：主张、证据与证明目的',
      source: '民事诉讼方法卡',
      url: officialLawUrls.civilProcedureInterpretation,
      summary: '核心概念：证据不是“材料越多越好”，而要能证明具体主张，并形成时间、主体和行为之间的链条。适用场景：合同、借款、劳动和消费纠纷。自测问题：我想证明哪一个事实，这份材料由谁形成，能否确认时间且是否可被篡改？',
    },
    {
      title: '合同审查四步：主体、标的、履行、违约',
      source: '《民法典》实用卡',
      url: officialLawUrls.civilCode,
      summary: '核心概念：先确认谁有权签约，再明确买卖什么、如何验收付款，最后约定违约后的可执行补救。适用场景：采购、外包和租赁。自测问题：如果对方明天不履行，我能凭哪一条款、哪一证据计算损失并主张权利？',
    },
    {
      title: '权利有边界：合理注意义务从何而来',
      source: '民法科普',
      url: officialLawUrls.civilCode,
      summary: '核心概念：行为自由通常以不侵害他人权益为边界，风险可预见性、控制能力和成本会影响注意义务。适用场景：经营场所、网络发言和安全管理。自测问题：我能否预见损害、是否有能力低成本避免，以及是否留下了履责记录？',
    },
  ],
  economy: [
    {
      title: '机会成本：真正的成本是放弃的最好选项',
      source: '经济学原理卡',
      url: domesticKnowledgeUrl('机会成本'),
      summary: '核心概念：时间、资金和注意力都有替代用途，账面免费不代表没有成本。适用场景：选工作、做项目和配置资金。自测问题：如果不做这件事，我能把同样资源投入到哪个最好选项，它可能带来什么确定或不确定回报？',
    },
    {
      title: '通胀如何改变现金、债券与权益资产',
      source: '宏观经济科普',
      url: domesticKnowledgeUrl('通货膨胀'),
      summary: '核心概念：通胀侵蚀固定购买力，也可能推高利率与企业成本；资产表现取决于增长、定价权和估值，而非简单涨跌公式。适用场景：理解储蓄和投资组合。自测问题：我的回报是名义收益还是真实收益，资产能否把成本转嫁出去？',
    },
    {
      title: '资产配置先于选品：收益来自承担何种风险',
      source: '投资基础方法卡',
      url: domesticKnowledgeUrl('资产配置'),
      summary: '核心概念：现金、债券、权益和实物资产承担的增长、利率、流动性风险不同；先定目标、期限与承受力，再谈产品。适用场景：基金和长期理财。自测问题：这笔钱何时要用，最大可承受回撤是多少，组合是否押注同一种风险？',
    },
  ],
  business: [
    {
      title: '单位经济模型：每新增一位客户是否创造价值',
      source: '商业分析方法卡',
      url: domesticKnowledgeUrl('单位经济模型'),
      summary: '核心概念：用客单价、毛利、留存、获客成本和服务成本判断单个客户全生命周期是否赚钱。适用场景：创业、产品和渠道投放。自测问题：如果规模扩大十倍，单客贡献会变好还是变差，回收获客成本需要多久？',
    },
    {
      title: '现金转换周期：利润之外，钱被占用多久',
      source: '财务管理科普',
      url: domesticKnowledgeUrl('现金转换周期'),
      summary: '核心概念：从付出采购款到收回销售现金的时间，取决于库存、应收和应付周转。适用场景：零售、制造和项目制业务。自测问题：增长会先带来现金还是先吞噬现金，哪个环节最占资金且能否通过条款改善？',
    },
    {
      title: '商业护城河：优势必须能延缓模仿',
      source: '竞争战略方法卡',
      url: domesticKnowledgeUrl('竞争优势'),
      summary: '核心概念：品牌只是结果，较可持续的优势常来自网络效应、转换成本、规模经济、独特资源或流程。适用场景：分析公司和设计产品战略。自测问题：竞争者复制我的功能后，客户为何仍不离开，优势会随规模增强还是被稀释？',
    },
  ],
  technology: [
    {
      title: '大模型在做什么：从下一个词预测到通用能力',
      source: 'AI 原理科普',
      url: domesticKnowledgeUrl('大语言模型'),
      summary: '核心概念：大模型通过海量数据学习符号之间的统计结构，以逐步预测生成内容；能力强不等于事实可靠。适用场景：写作、检索和自动化。自测问题：任务需要的是语言模式还是可验证事实，应该在哪里加入资料、工具和人工复核？',
    },
    {
      title: 'AI 代替的是任务，不是整份职业',
      source: '技术与劳动科普',
      url: domesticKnowledgeUrl('技术性失业'),
      summary: '核心概念：职业由多种任务组成，AI 先压缩规则清晰、数字化、可验证的部分，同时放大定义问题、承担责任和建立信任的价值。适用场景：职业规划。自测问题：我的工作中哪些任务可标准化，哪些依赖现场、关系、判断和责任？',
    },
    {
      title: '科技成熟度：原型成功不等于规模化可用',
      source: '技术成熟度科普',
      url: domesticKnowledgeUrl('技术成熟度曲线'),
      summary: '核心概念：实验室指标只是起点，产品化还要跨越成本、可靠性、供应链、标准和用户采用。适用场景：判断科技热点与投资叙事。自测问题：成果在哪个环境被验证，单位成本是多少，规模扩大后哪个约束最先出现？',
    },
  ],
  medicine: [
    {
      title: '看懂健康结论：相关性不等于因果',
      source: '循证医学科普',
      url: domesticKnowledgeUrl('循证医学'),
      summary: '核心概念：个案、观察研究和随机对照试验能回答的问题不同；样本、对照、偏倚和效应量决定结论强度。适用场景：辨别养生与治疗信息。自测问题：结论是否有对照，改善有多大，适用于谁，又有哪些风险和不确定性？',
    },
    {
      title: '中医辨证：系统观察的价值与证据边界',
      source: '中医药科普方法卡',
      url: domesticKnowledgeUrl('中医辨证'),
      summary: '核心概念：辨证强调症状组合、个体状态和动态变化，适合形成整体观察框架；疗效判断仍需关注诊断、安全性和可靠研究。适用场景：理解中医表达。自测问题：这是解释框架还是已证实疗效，是否排除了急症并说明禁忌与相互作用？',
    },
    {
      title: '针灸研究怎么读：对照、盲法与效应量',
      source: '临床研究方法卡',
      url: domesticKnowledgeUrl('针灸'),
      summary: '核心概念：针灸研究需区分与不治疗、常规治疗或模拟针刺的比较，并同时看统计差异和临床意义。适用场景：阅读疼痛与康复研究。自测问题：对照组是什么，改善幅度是否足以被患者感知，报告了哪些不良反应？',
    },
  ],
  energy: [
    {
      title: '电力系统第一原则：发用电必须实时平衡',
      source: '电力系统科普',
      url: domesticKnowledgeUrl('电力系统'),
      summary: '核心概念：电网中的频率反映供需瞬时平衡，调度需要同时满足安全、经济和设备约束。适用场景：理解限电、调峰和辅助服务。自测问题：需求突然上升时，谁能在秒、分、小时三个尺度补上缺口？',
    },
    {
      title: '电量价值与容量价值不是一回事',
      source: '电力市场方法卡',
      url: domesticKnowledgeUrl('电力市场'),
      summary: '核心概念：发出多少电体现能量价值，关键时刻能否可靠供电体现容量价值；低电价不必然意味着系统成本低。适用场景：分析新能源和电力市场。自测问题：某电源在系统最紧张时能提供多少可靠能力？',
    },
    {
      title: '新能源消纳：波动性需要一组系统解法',
      source: '能源转型科普',
      url: domesticKnowledgeUrl('新能源消纳'),
      summary: '核心概念：提高风光占比需要跨区输电、灵活电源、储能、需求响应和预测调度协同，而非依赖单一技术。适用场景：理解新型电力系统。自测问题：这项方案解决的是秒级、日内还是季节性波动，成本由谁承担？',
    },
  ],
};

const supplements: Record<LearningCategoryId, LearningSeed[]> = {
  politics: [
    {
      title: '公共政策的起点：区分目标、工具与约束',
      source: '公共政策分析卡',
      url: domesticKnowledgeUrl('公共政策'),
      summary: '核心概念：好的政策分析要分别识别想改变的结果、实际使用的工具以及财政、执行和行为约束。适用场景：阅读改革方案与公共议题。自测问题：目标是否可衡量，工具能否触达问题根源，又会产生什么非预期反应？',
    },
    {
      title: '集体行动难题：人人受益为何仍无人行动',
      source: '《集体行动的逻辑》思想卡',
      url: domesticKnowledgeUrl('集体行动'),
      summary: '核心概念：群体共同受益不代表个体愿意付出，搭便车、组织成本与选择性激励会影响行动。适用场景：社区治理、团队协作和行业联盟。自测问题：贡献成本由谁承担，收益能否排他，怎样让参与者获得可见回报？',
    },
    {
      title: '国家能力：规则写出来之后谁来执行',
      source: '政治学科普',
      url: domesticKnowledgeUrl('国家能力'),
      summary: '核心概念：制度效果还取决于信息收集、财政动员、专业组织和持续执行能力。适用场景：比较政策落地速度与公共服务质量。自测问题：执行链条需要哪些数据、人员和预算，哪个环节最可能使规则停留在纸面？',
    },
  ],
  thinking: [
    {
      title: '第一性原理：把惯例还原为事实与约束',
      source: '思维方法卡',
      url: domesticKnowledgeUrl('第一性原理'),
      summary: '核心概念：先拆掉“大家一直如此”的假设，确认不可改变的事实，再从约束重新组合方案。适用场景：成本优化、产品创新和复杂决策。自测问题：哪些是物理或法律约束，哪些只是流程习惯，若从零开始我会怎样设计？',
    },
    {
      title: '贝叶斯思维：新证据应当怎样改变判断',
      source: '概率思维科普',
      url: domesticKnowledgeUrl('贝叶斯推断'),
      summary: '核心概念：判断应从基础概率出发，再按证据在不同假设下出现的可能性逐步更新。适用场景：识别风险、诊断问题和评估传闻。自测问题：我的先验概率是多少，这条证据在相反结论成立时是否也很常见？',
    },
    {
      title: '读《史记》：把人物选择放回利益与时代',
      source: '《史记》经典研读',
      url: domesticKnowledgeUrl('史记'),
      summary: '核心概念：人物性格只有放进资源、身份、关系与时代规则中，才能解释真实选择。适用场景：历史阅读、人物分析和组织复盘。自测问题：人物有哪些可选道路，每条道路的代价是什么，身份又限制了哪些选择？',
    },
  ],
  psychology: [
    {
      title: '基本归因偏差：别把处境误判成人品',
      source: '社会心理学方法卡',
      url: domesticKnowledgeUrl('基本归因错误'),
      summary: '核心概念：我们容易用性格解释他人行为，却低估压力、规则与资源限制。适用场景：识人、管理和冲突复盘。自测问题：如果我处在相同激励、时间压力和信息条件下，是否也可能做出类似行为？',
    },
    {
      title: '心理边界：负责自己的选择，不接管他人人生',
      source: '关系边界方法卡',
      url: domesticKnowledgeUrl('个人边界'),
      summary: '核心概念：边界不是冷漠，而是区分我的感受、责任和决定与他人的部分。适用场景：家庭、人际和职场协作。自测问题：这件事谁有决定权、谁承担后果，我是在提供帮助还是替对方承担本应自负的责任？',
    },
    {
      title: '博弈中的可信承诺：判断行动而不是表态',
      source: '行为与博弈科普',
      url: domesticKnowledgeUrl('博弈论'),
      summary: '核心概念：真正可信的承诺通常伴随成本、约束或可验证行动；低成本表态很容易改变。适用场景：合作谈判与提防恶意。自测问题：对方为承诺投入了什么不可轻易收回的成本，违约后又会失去什么？',
    },
  ],
  law: [
    {
      title: '诉讼时效：有权利也要在时间内行动',
      source: '《民法典》实用卡',
      url: officialLawUrls.civilCode,
      summary: '核心概念：多数民事请求权存在时效，持续主张、对方承认等事实可能影响计算。适用场景：欠款、合同和侵权纠纷。自测问题：我何时知道权利受损，是否留下催告、协商或对方确认债务的可验证记录？',
    },
    {
      title: '表见代理：为什么核验授权比看名片重要',
      source: '合同法律方法卡',
      url: domesticKnowledgeUrl('表见代理'),
      summary: '核心概念：签约人是否有授权会影响合同责任，职位、印章、历史交易和相对人审慎程度都可能重要。适用场景：采购、销售和公司合作。自测问题：谁授权其签约，我核验了哪些文件，付款账户与合同主体是否一致？',
    },
    {
      title: '个人信息保护：处理数据先问必要性',
      source: '个人信息保护法科普',
      url: officialLawUrls.personalInformationProtection,
      summary: '核心概念：收集和使用个人信息应有明确目的，并遵循最小必要、知情和安全原则。适用场景：表单、客户管理与内部系统。自测问题：这项数据是否完成目的所必需，保存多久，谁能访问，发生泄露后怎样处置？',
    },
  ],
  economy: [
    {
      title: '边际思维：不要拿平均数替代下一步决策',
      source: '经济学原理卡',
      url: domesticKnowledgeUrl('边际主义'),
      summary: '核心概念：决策应比较再多投入一单位带来的新增收益与新增成本，而不是沉迷历史平均值。适用场景：加班、扩产、营销和学习。自测问题：下一单位投入会增加多少结果，它是否仍优于资源的其他用途？',
    },
    {
      title: '复利的另一面：费用和亏损也会累积',
      source: '长期理财方法卡',
      url: domesticKnowledgeUrl('复利'),
      summary: '核心概念：长期结果由收益率、时间、费用、税费与大幅回撤共同决定，复利并不只放大收益。适用场景：基金比较和长期储蓄。自测问题：扣除全部成本后的真实收益是多少，出现大回撤后需要上涨多少才能回本？',
    },
    {
      title: '周期判断：库存、信用与预期如何共振',
      source: '宏观经济方法卡',
      url: domesticKnowledgeUrl('经济周期'),
      summary: '核心概念：需求变化会经库存和融资条件被放大，乐观与悲观预期又会反过来影响投资。适用场景：观察行业景气与资金流向。自测问题：库存是在主动补充还是被动积压，信用条件又在放松还是收紧？',
    },
  ],
  business: [
    {
      title: '价值主张：客户究竟雇你的产品做什么',
      source: '《创新者的任务》思想卡',
      url: domesticKnowledgeUrl('待办任务理论'),
      summary: '核心概念：客户购买的不是功能清单，而是在特定情境下完成进步的方案。适用场景：产品定位、访谈和创新。自测问题：客户在什么时刻产生需求，原来用什么替代方案，选择我们后获得了什么可衡量进步？',
    },
    {
      title: '定价不是成本加成：先识别客户价值',
      source: '商业定价方法卡',
      url: domesticKnowledgeUrl('定价策略'),
      summary: '核心概念：价格连接客户感知价值、支付意愿、竞争替代和企业成本，单纯成本加成会忽略差异化。适用场景：服务报价和产品套餐。自测问题：客户因产品多赚或少损失多少，不同人群的价值和替代选择有何不同？',
    },
    {
      title: '增长飞轮：一次投入能否推动下一次增长',
      source: '商业增长方法卡',
      url: domesticKnowledgeUrl('飞轮效应'),
      summary: '核心概念：可持续增长需要形成互相强化的环节，例如更多用户带来更多供给，再改善体验并降低获客成本。适用场景：平台、内容和社区业务。自测问题：增长链条中哪一步会自然增强下一步，哪里仍依赖持续烧钱推动？',
    },
  ],
  technology: [
    {
      title: '检索增强生成：让大模型先查资料再回答',
      source: 'AI 工程方法卡',
      url: domesticKnowledgeUrl('检索增强生成'),
      summary: '核心概念：RAG 先检索相关资料，再将证据交给模型生成答案，可提高时效性与可追溯性。适用场景：企业知识库与专业问答。自测问题：检索是否找对内容，回答能否标明证据，资料冲突时怎样处理？',
    },
    {
      title: '自动化设计：先找稳定流程，再找模型',
      source: 'AI 应用方法卡',
      url: domesticKnowledgeUrl('业务流程自动化'),
      summary: '核心概念：自动化价值来自明确输入、稳定步骤、可验证输出与异常处理，而不只是接入模型。适用场景：办公流程和智能体设计。自测问题：成功标准能否机器判断，异常由谁接管，错误成本是否可承受？',
    },
    {
      title: '数据飞轮：数据多不等于数据有用',
      source: '机器学习工程卡',
      url: domesticKnowledgeUrl('机器学习'),
      summary: '核心概念：有价值的数据闭环需要产品产生反馈、反馈改善模型、模型再提升体验，并控制偏差与隐私风险。适用场景：推荐、搜索和预测系统。自测问题：新增数据是否代表真实结果，还是只重复已有偏见与错误？',
    },
  ],
  medicine: [
    {
      title: '绝对风险与相对风险：疗效数字可能差十倍',
      source: '循证医学方法卡',
      url: domesticKnowledgeUrl('相对风险'),
      summary: '核心概念：风险下降一半可能是从 2% 到 1%，也可能是从 40% 到 20%；必须同时看基线风险。适用场景：理解治疗和筛查宣传。自测问题：原始风险是多少，需要多少人接受干预才能多避免一个结局？',
    },
    {
      title: '安慰剂效应：主观改善不等于病因消失',
      source: '医学研究科普',
      url: domesticKnowledgeUrl('安慰剂效应'),
      summary: '核心概念：期待、照护环境与自然波动会影响主观感受，因此疗效研究需要合适对照。适用场景：判断保健与疼痛干预。自测问题：改善是否超过自然恢复和期待效应，客观指标与长期结果是否同步变化？',
    },
    {
      title: '中药安全：天然并不自动等于低风险',
      source: '合理用药科普',
      url: domesticKnowledgeUrl('中药安全'),
      summary: '核心概念：药材也有剂量、不良反应、污染风险和药物相互作用，来源与炮制会影响安全。适用场景：自我保健与合并用药。自测问题：成分和剂量是否明确，是否与处方药冲突，肝肾功能或特殊人群是否适用？',
    },
  ],
  energy: [
    {
      title: '需求响应：用电负荷也可以参与调度',
      source: '新型电力系统科普',
      url: domesticKnowledgeUrl('需求响应'),
      summary: '核心概念：通过价格或激励让用户在紧张时段移峰、减载，可减少高成本备用资源需求。适用场景：园区、充电和工业负荷管理。自测问题：哪些负荷可调整而不影响核心生产，响应速度与持续时间分别是多少？',
    },
    {
      title: '储能经济性：关键不是容量，而是使用次数',
      source: '储能商业分析卡',
      url: domesticKnowledgeUrl('储能'),
      summary: '核心概念：储能收益取决于价差、循环次数、效率、寿命、容量价值和辅助服务，而非只看装机成本。适用场景：评估储能项目。自测问题：一年实际调用多少次，每次净收益能否覆盖衰减、融资和运维成本？',
    },
    {
      title: '边际电价：最后一台机组为何影响市场价格',
      source: '电力市场科普',
      url: domesticKnowledgeUrl('边际成本'),
      summary: '核心概念：集中竞价中，满足最后一单位需求的边际资源可能决定统一价格，同时还受网络约束影响。适用场景：理解现货电价波动。自测问题：当前需求由哪类机组边际满足，输电阻塞又如何改变不同地点的价格？',
    },
  ],
};

function dayNumber(date: Date) {
  return Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86_400_000);
}

function materialize(category: LearningCategoryId, date: Date, rotation = 0) {
  const items = [...library[category], ...supplements[category]];
  const offset = (dayNumber(date) + rotation) % items.length;
  return items.map((_, index) => {
    const item = items[(index + offset) % items.length];
    return {
      ...item,
      id: `growth-${category}-${(index + offset) % items.length}`,
      publishedAt: date.toISOString(),
      category,
      categoryLabel: categoryLabels[category],
    };
  });
}

export function getLearningContent(category: 'digest' | LearningCategoryId, date = new Date(), rotation = 0) {
  if (category !== 'digest') return materialize(category, date, rotation);

  const categories = Object.keys(library) as LearningCategoryId[];
  const offset = (dayNumber(date) + rotation) % categories.length;
  return categories.map((_, index) => {
    const activeCategory = categories[(index + offset) % categories.length];
    return materialize(activeCategory, date, rotation + index)[0];
  });
}

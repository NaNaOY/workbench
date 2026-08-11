const directKnowledgeSources: Record<string, string> = {
  国家为什么会失败: 'https://book.douban.com/works/1029452',
  道德经: 'https://www.gushiwen.cn/guwen/book_db8fe8b5a11f.aspx',
  资治通鉴: 'https://www.gushiwen.cn/guwen/book_46653FD803893E4F541B441F62EF7589.aspx',
  '思考，快与慢': 'https://book.douban.com/subject/37270984/',
  史记: 'https://www.gushiwen.cn/guwen/book.aspx?id=5',
  个人边界: 'https://dxs.moe.gov.cn/zx/a/xl_xlyz_xlwc/221014/1755428.shtml',
  单位经济模型: 'https://m.jiemian.com/article/716873.html',
  待办任务理论: 'https://www.woshipm.com/share/6045055.html',
  中医辨证: 'https://hnzk.cbpt.cnki.net/portal/journal/portal/client/paper/fee707b1d433d7ff59a781bb6b9820a0',
  针灸: 'https://www.sinomed.ac.cn/article.do?ui=2024470505',
  中药安全: 'https://www.nmpa.gov.cn/directory/web/nmpa/images/1641548441865014240.pdf',
  相对风险: 'https://literature.chinacdc.cn/xuekefuwu/gonggongweishengxueshuredianzhuiz/201903/t20190325_200391.html',
  新能源消纳: 'https://hbj.nea.gov.cn/xxgk/zcjd/202406/t20240605_264068.html',
  需求响应: 'https://henb.nea.gov.cn/hdhy/zlxz/202412/P020241205337404362915.pdf',
  储能: 'https://www.nea.gov.cn/20250407/70807f4e90394bf7b301a83917a6d81a/c.html',
};

const mbaKnowledgeTopics: Record<string, string> = {
  国际关系理论: '国际关系',
  系统思考: '系统思维',
  非暴力沟通: '非暴力沟通',
  社会心理学: '社会心理学',
  机会成本: '机会成本',
  通货膨胀: '通货膨胀',
  资产配置: '资产配置',
  现金转换周期: '现金转换周期',
  竞争优势: '竞争优势',
  大语言模型: '大语言模型',
  技术性失业: '技术性失业',
  技术成熟度曲线: '技术成熟度曲线',
  循证医学: '循证医学',
  电力系统: '电力系统',
  电力市场: '电力市场',
  公共政策: '公共政策',
  集体行动: '集体行动',
  国家能力: '国家能力',
  第一性原理: '第一性原理',
  贝叶斯推断: '贝叶斯定理',
  基本归因错误: '基本归因错误',
  博弈论: '博弈论',
  表见代理: '表见代理',
  边际主义: '边际主义',
  复利: '复利',
  经济周期: '经济周期',
  定价策略: '定价策略',
  飞轮效应: '飞轮效应',
  检索增强生成: '检索增强生成',
  业务流程自动化: '业务流程管理',
  机器学习: '机器学习',
  安慰剂效应: '安慰剂效应',
  边际成本: '边际成本',
};

export function domesticKnowledgeUrl(topic: string) {
  const directSource = directKnowledgeSources[topic];
  if (directSource) return directSource;

  const mbaTopic = mbaKnowledgeTopics[topic];
  if (mbaTopic) return `https://wiki.mbalib.com/wiki/${encodeURIComponent(mbaTopic)}`;

  // Baidu Baike is kept only as a mainland-accessible fallback for newly added topics.
  return `https://baike.baidu.com/item/${encodeURIComponent(topic)}`;
}

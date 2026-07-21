const EMBA_ACCESS_KEY = "turnpo:emba-access";
const EMBA_PASSWORD = "emba2026";
const EMBA_LIBRARY_KEY = "turnpo:emba-library";
const EMBA_LIBRARY_API = "/api/emba/library";
const EMBA_UPLOAD_API = "/api/emba/upload";
const EMBA_KNOWLEDGE_INDEX = "/emba/content/knowledge-index.json";
const DEFAULT_START_MONTH = "2026-06";
const DEFAULT_END_MONTH = "2028-12";
const CLOUD_SAVE_DELAY_MS = 700;
const THINKING_REVIEW_STATUSES = ["pending", "keep", "rewrite", "action", "complete"];
const HIDDEN_MATERIAL_FILES = new Set([
  "/emba/materials/2026-07/handwritten-notes/leadership-learning-notes-analysis.md"
]);
const PREPARATION_MATERIAL_TYPES = new Set([
  "course_overview",
  "course_requirements",
  "daily_course_intro",
  "reading_learning_map",
  "case_inspiration"
]);
const JULY_THINKING_FABLES = {
  T01: "井边的空桶\n\n旱季的第三周，青石村每天都有讲水的人进祠堂。阿拓坐在最前排，抄下坡度、闸门和蓄池的图。他抄得很快，回家时却发现母亲又把半桶水倒给邻居：井口的绳子越来越长，桶底碰到水的声音越来越迟。\n\n他先照课堂上的图检查北坡水渠，发现一截石槽有裂缝。村长说那裂缝去年就有，拿泥补上即可。阿拓补了两次，井水仍在降。几天后，赶车的女人说马蹄总在村东湿地陷住；阿拓却嫌这和上游无关，没有去看。\n\n暴雨那夜，祠堂屋檐的水全冲到街上。阿拓忽然想起守庙人说过，新砌的围墙把旧水沟封了。他带着空桶，沿墙根找了一夜，才在一丛苦艾后找到被埋住的出水口。第二天，他没有再开讲水会，而是把空桶摆在井边，叫每个挑水的人在桶上写下自己看到的第一处异常。\n\n桶身很快被写满：湿地、裂槽、围墙、北坡新菜地。井水恢复得很慢，但再没有无声下降。阿拓后来明白，真正的问题从不先住在图纸上；它先住在谁每天都提着、却始终提不满的桶里。",
  T02: "匠人的直尺\n\n鲁正的铜尺跟了他三十年。他用它给城门量过梁，也给富商量过书桌。徒弟只要照尺做，少返工，少挨骂，木坊因此从不缺订单。\n\n阿言做了一张窄书桌，鲁正一量便叫她拆掉左边两分。阿言没有辩解，只请他坐下写一封信。鲁正刚落笔，手肘撞上墙。他沉着脸说，房间小，不是桌子的错。第二天，阿言加宽桌面；鲁正又说桌脚占了账房过道，叫她再拆。\n\n阿言夜里没动锯子，去问账房怎样摊账簿，问抄写员怎样放墨瓶，问腿脚不便的老先生怎样起身。第三天，她在桌侧做了一个能抽出的窄板。鲁正看见后很不高兴：铜尺上没有这种尺寸。\n\n两个月后，老先生把一封写到一半的信放在抽板上，慢慢站起身，墨瓶没有翻，账簿也没有掉。鲁正站在窗边很久，终于把铜尺放进抽屉。他仍量木头，只是不再先量。他开始问：谁会坐在这里？谁会在这里把手肘撞到墙？",
  T03: "红墨水的信\n\n校稿人宁川把每一篇稿子都当作自己的脸。主编的红线一落在纸上，他先感到耳朵发烫，再去读字。一次主编圈出一段开头，写了四个字：太快，读者跟不上。宁川把稿纸折进袖子，说读者没有耐心，不是他的错。\n\n他连夜重写，删掉三段，又在会上把新的版本读得很响。主编只问：为什么那个老人突然离开码头？宁川说细节不重要。散会时，他听见两个年轻校对员在楼梯间说，那一段像被谁从中间剪掉了。\n\n宁川本想冲进去，却在邮局门口看见一个小女孩读父亲寄来的家书。她每读到陌生词就停下，母亲不替她翻页，只把前一句再念一遍。女孩终于自己说出：所以他是在怕我忘记他。\n\n回到桌前，宁川把红线旁边另画三栏：纸上真正写了什么；我以为对方在说什么；我还没问的是什么。第二天他没有照单全收，却把老人离开的那一段补回去，也在会议上复述主编的话，请他确认。红墨水仍然刺眼，但它终于从一把小刀，变成了能照出纸背的灯。",
  T04: "未完的陶罐\n\n陶工铺的掌柜以手快闻名。谁的罐子开裂，他就把坏的推到墙角，取一团新泥重做。客人喜欢这种干脆，学徒也喜欢：裂缝一出现，没人追问是谁的手留下了它。\n\n青禾烧坏一个大水罐时，掌柜照例伸手拿泥。她却抱住罐口，说再给她一晚。掌柜答应了。她用炭笔沿裂纹描线，发现它从提耳底下绕了一圈。第二天，她把提耳做薄些，烧出来还是裂。掌柜说，火候不稳，别再浪费窑位。\n\n青禾把第二只裂罐藏到柴堆后。夜里下雨，水从屋檐滴进裂口，罐子倒映出一道细长的灯光。她忽然看见，自己每次为了遮住第一次按坏的手印，都会把提耳压得更厚；厚泥在火里缩得更狠。\n\n翌晨，她把两只裂罐都搬上长桌。掌柜想发火，却看见她把手印、炭线、窑温和烧制时辰排在一起。后来铺子立了新规矩：裂罐不能马上重做，主人先要把它留到第二天。长桌上常有难看的罐子，但学徒们不再只学会把错误砸碎；他们开始学会让裂缝把来路说完。",
  T05: "未点燃的火柴\n\n港口城的告示墙只贴已经发生的事：哪艘船靠岸，谁家的店开张，哪个孩子得了奖。阿徊曾贴过一张小纸，说也许可以把潮汐和雾画在同一张会动的图上。三天后纸被雨打成一团，他怕人笑，自己揭走了。\n\n入冬后，运药船在浓雾里错过港口。码头的人围着灯塔吵到半夜：守灯人要加灯，钟楼人要换钟，商人要罚船长。阿徊拿着那张没画完的纸站在后面，始终没开口。第二天，另一艘小船又在同一片水面擦过浅滩，船底划出长长一道白痕。\n\n阿徊把纸钉到仓库门口，旁边放了粉笔。他没有说这是解决办法，只写：谁知道雾来的时候，画一笔。第一天只有孩子画了一团灰；第二天渔夫添上浅滩，守灯人加了光照不到的弯角，老妇人写下丈夫总在什么钟声后回家。\n\n木板很快脏乱不堪，商人嫌它不像正式地图。可下一次雾起时，年轻船长靠着那块板提前绕开了弯角。阿徊没有把木板搬进展览室。他让它继续挂在风雨里，因为有些想法不该先被保护得完美；它们要先被允许沾上别人的手印。",
  T06: "背面的灰尘\n\n闻墨把书库管得像一座安静的军营。书按颜色、大小和借阅次数排好，每天下午他都会擦书脊，连烫金的年份也不许落灰。来访的人都说这里好找书。\n\n一个孩子来找候鸟的资料，闻墨带他在“动物”“地理”“季节”三排之间走了三遍，仍找不到合适的书。孩子蹲下去，从最底层抽出一本没人借的航海日志，里面夹着褪色的鸟图，背后写着风向、潮位和渔民的口述。闻墨说这不合分类，叫他放回去。\n\n几天后，研究河口的先生也来找鸟。他带着精确的表格，却因不知道哪天潮水倒灌，得不出解释。孩子又把日志拿出来。先生在夹页里发现同一年码头搬迁的记录，忽然改了自己的表格。\n\n闻墨那晚把所有最底层的书抽出来，桌上积起厚灰。他没有重排，而是在每本书后放一张空卡，写着“里面还有什么”。书库从此不再一眼就整齐；桌上常有没归位的纸条。但他明白了，盲点不是把书放错了地方，而是只相信书脊告诉你的那一个名字。",
  T07: "无声的旗杆\n\n赤衡的船队从不迟疑。他站在礁石上挥旗，蓝旗向东，所有船便向东；红旗落下，所有船立刻收帆。风浪最大的年份，他靠这个办法带回最多的鱼，于是没人再愿意在他挥旗前说话。\n\n春天，一条近路在暗礁间露出来。赤衡算过潮时，决定赌一次。蓝旗刚落，老水手桑伯没有起锚，只抬头看一眼北边的泡沫。赤衡叫他别拖累船队。桑伯终于开口，说泡沫走得不像退潮；年轻舵手也说，夜里听见礁下有撞击声。\n\n赤衡照旧出发。第一艘船只是擦坏船底，他说这是运气不好。第二艘船的网却被暗石勾住，船员为保网差点把小船掀翻。赤衡在礁外停住，看到后面几条船不是不敢跟，而是在等谁先允许他们说看见了什么。\n\n他把蓝旗卷起，换上一面从没用过的白旗：先报水深，再报航向。那天他们错过了最早的一群鱼，却带回所有船。后来旗杆下多了一根短绳，任何船都能拉响。赤衡仍是船长，只是他终于知道，真正的跟随不是把眼睛交给旗帜，而是愿意把自己看见的险处带到同一张海图上。",
  T08: "最小的齿轮\n\n钟塔修缮时，议会把最大的铜齿轮摆在大厅中央。它来自远城，沉得四个人才能抬起，价钱写在账本第一页。上链的人、清灰的人和修小弹簧的女孩，只能从后门进。\n\n开塔那天，铜齿轮果然转得漂亮，围观的人鼓掌，钟锤却始终没有落下。议员们叫更多人推轮，轮转得更急，塔里却只剩咯咯的空响。女孩从后门挤进去，发现轴心的擒纵叉被灰卡住；她去拿针时，管钥匙的人说工具箱不能离开后室。\n\n傍晚，城里错过了关城门的时辰。一辆载药的车被挡在城外，守卫说自己只听钟声。议会这才叫女孩进塔。她用细针拨正擒纵叉，又让清灰的人把盖板拆下。第一声钟响时，没人再看铜齿轮。\n\n后来检修表不再把零件按价钱排序，而是写：如果它今天缺席，哪一步会先停？最大的轮仍在塔中央，只是再也不独自站在灯下。",
  T09: "旧航图的白边\n\n苏离继承祖父的海图时，所有人都说那是最好的图。红线标暗礁，蓝线标回流，连最难走的南岬也被画得像一条熟路。他把图装进玻璃框，相信好船长不该每天怀疑前人的准确。\n\n第一年，他绕开图上的暗礁，却在空海抛锚：风暴已把礁石削平。他把这件事写成偶然。第二年，北湾新起的沙洲擦坏渔船，他说渔民没有照图走。第三年，潮水从一条图上没有的窄口倒灌进盐仓，商人拿着赔偿单堵在他门口。\n\n苏离终于把祖父的图取下，在旁边铺一张透明纸。他规定每艘船回来都要画一处与预期不同的地方，哪怕只是海鸟忽然换了落点。起初，船员嫌这浪费时间；后来透明纸上出现一条条细线，像海岸在玻璃后悄悄移动。\n\n祖父的红线没有被擦掉。苏离只是再也不把没有标记的白边当作没有事情发生。",
  T10: "门槛上的椅子\n\n山间客栈的掌柜换了新牌子，上面刻着“人人欢迎”。大厅变亮了，桌椅也擦得发白；可晚饭时，外地赶路的人仍坐在门边，本地商人围着炉火，没人赶他们，却也很少有人问他们从哪里来。\n\n暴雨封路的晚上，一个年轻车夫说河桥的第三块木板裂了。掌柜笑着给他添酒，说山里的桥年年响，不必吓唬客人。车夫把话吞回去。第二天，商人的马车在桥边陷住半轮，幸好没有翻下河。掌柜说那只是雨太大。\n\n傍晚，车夫又来。他没再谈桥，只把湿靴放在门槛外。掌柜看见靴底夹着一根断木刺，才把椅子搬到门口，请他坐下把路画出来。老人、厨娘和商人也围过去，发现桥下的石墩早被冲出空洞。\n\n后来那张椅子留在门槛上。谁带来坏消息、陌生口音或不合群的意见，都先坐在那里把话说完；炉边的人要先复述，再决定是否反驳。客栈没有变得没有争执，只是有些原本会被礼貌挡在门外的声音，终于能走到火边。",
  T11: "三层信鸽棚\n\n传令塔有三层鸽棚。顶层的鸽子带地图和边境消息，中层带车队、粮册和时程，底层的纸条常沾着泥：桥板松动、哪口井发苦、哪匹马伤了蹄。老塔长每天把三种纸放在同一张长桌上看。\n\n新塔长嫌桌面太乱，命人把所有信压缩成一张日报。顶层只看方向，底层只报完成，中层负责删去“细枝末节”。第一周，塔里安静得像新粉过的墙。第二周，北境急需的车轮运到南境；第三周，十车盐停在一座已断三天的桥前。\n\n新塔长召开会，问谁把路线写错了。中层管事摊开日报：目的地、数量、日期都没错。直到老鸽医从废纸篓捡出三张原条：冬前补给、十车盐、桥板松动。它们分开看都很轻，放在一起却像一记闷雷。\n\n塔长重新摆回长桌，还在每封信上加了一行：这句话要由谁翻译给谁，收到后要把什么带回来。塔里从此又有泥点，也有争论；但远方不再只是一张干净的地图，近处也不再只是没人问的麻烦。",
  T12: "没有门牌的房间\n\n许岚的染坊总能染出最稳的蓝。她把手指伸进染缸，闻一闻蒸汽，就知道该添灰还是添盐。学徒们围着她看，以为只要记住她的动作，便能接住她的手。\n\n她去外城送布的那周，第一缸蓝布发紫。学徒照旧添盐，第二缸更灰。有人说是新来的孩子不会看火，有人说该等许岚回来。第三天，商人带着退货站在门口，学徒们才在墙角找到许岚的小本子：潮湿日、厚棉、急单、旧井水——每一页都是她没说出口的例外。\n\n他们没有把本子锁进柜子，而是腾出一间小房。每次染布前，值班的人要写下天气、布料和自己改了什么；每次失败，先把失败样布挂进去。许岚回来时，发现墙上满是难看的灰紫色布片，先皱眉，后又一张张摸过去。\n\n门上没有写“知识”，只写“下一次”。因为真正被留下的，不是许岚曾经知道什么，而是后来的人不必在同一个染缸前，重新假装什么也没发生。",
  T13: "风筝与线轴\n\n阿临做出一只金鸟风筝，风一起来，它越过屋顶，连城墙上的孩子都仰头看。他觉得线轴太碍事，便把它搁在地上，说真正好的风筝应该自己找天空。\n\n午后，一阵侧风把金鸟卷向钟楼。阿临追到河堤，线缠在石栏上，风筝却越拉越高。他用力一扯，纸翼裂出一道口子；松手时，它又向城外的电线飘去。卖线的老人替他按住线轴，只问：你是想让它飞，还是想让它回来？\n\n第二天阿临补好纸翼，又让它飞得很高。这次他先看云层，把线绕在手腕上，留出能收也能放的余量。风向一变，他不立刻硬拉，而是记下风从哪条巷子钻出来。几次之后，金鸟飞得比以前更远，却从不再让他满城追赶。\n\n老人没有教他把风筝飞低。他只让阿临明白，放大一个人的高度，和交出方向，并不是同一件事。",
  T14: "会背答案的鹦鹉\n\n药铺老板养了一只鹦鹉，能背整本草药目录。客人一问咳嗽，它就喊川贝、枇杷、百合；一问腹痛，它又报出三味药名。围观的人越来越多，学徒背得再熟，也显得比不过这只鸟。\n\n一个春天，孩子拿来一把发黄的叶子，说院里的树病了。鹦鹉立刻报药。老药师却问树在阴处还是阳处、前夜有没有霜、黄叶从枝头还是从根边开始落。孩子答不上来，跑回去看，才发现那是换季前自然脱落。\n\n第二天，老板让学徒辨认另一株枯草。一个学徒背出十种可能，老药师却只叫他把根挖出来。根上缠着新铺路时漏下的石灰。鹦鹉在梁上仍然报药名，声音又快又准，却没有人再鼓掌。\n\n后来药铺的考试改了：先让学徒说自己还不知道什么，再让他带着问题去看树、看土、看天气。答案可以背得像鸟鸣；真正的掌握，是陌生的事来到面前时，仍知道下一眼该看哪里。",
  T15: "回声纸\n\n山谷的书记员以文笔好闻名。他把村民的争吵整理成漂亮公文，句子平稳，段落齐整。可每次读完，总有人皱眉：我没有这样说。书记员便解释，意思已经替大家写得更清楚了。\n\n修桥那年，木匠说桥墩会被洪水掏空，商贩说再拖三天货就烂，老人说上次加宽河道后淹过祖坟。书记员把三种话合成一句“各方同意尽快施工并兼顾安全”。纸面很好看，现场却没人愿意签字。\n\n制纸匠送他一叠会显出底纹的纸：先写原句，第二层墨水才可以归纳；若归纳得太远，纸边就浮出淡淡的回声。书记员重写时，木匠的担忧、商贩的期限和老人的记忆都留在旁边。他仍提出方案，却把哪些是事实、哪些是推断、哪些要回去问，分开标明。\n\n那份公文不再那么漂亮，却第一次有人把它带回家讨论。书记员终于知道，整理不是替别人制造声音；好的工具应让原来的声音在纸背仍有回响。",
  T16: "磨石上的刻痕\n\n铁匠铺门口挂着一把新镰刀，客人摸过刀刃便付钱。掌柜常说，客人买的是结果，不会为磨石上的灰和刻痕多给一文。于是小徒弟禾舟每次磨坏一把刀，都把痕迹磨平，再拿新的铁片重来。\n\n入夏后，新学徒连续在同一处磨出缺口。掌柜以为是他们手笨，换了三个人，缺口仍在。禾舟想起自己曾在同一块磨石上留下浅坑，却因怕挨骂把它藏在柴房。\n\n他把磨石搬到门口，在旁边钉了一块旧铁板。每做完一把镰刀，学徒先在旧铁板上试两下，再在墙上画出自己改了什么。掌柜嫌这耽误出货，直到一位客人拿回断刃，禾舟翻出墙上的记号，发现那天新铁料比往常硬，角度还沿用了旧料的手法。\n\n后来门口仍挂最亮的镰刀，磨石却不再被藏起来。它上面的刻痕没有变少，只是终于成了下一把刀开始之前，所有人都会先看的地方。",
  T17: "一桶井水\n\n山村只有一口深井。水足时，菜农清晨灌地，旅店午后洗布，老人傍晚打水，谁也不觉得规矩必要。入秋后，井绳每次提上来都轻一点，井边开始有人提前放桶占位。\n\n菜农说旅店洗床单太多，旅店说菜农天没亮就放水，老人说年轻人只会抢。村长每天劝大家和气，争吵却从井边蔓延到集市。一天夜里，有人割断旅店的水绳；第二天，菜地的沟渠被石头堵住。\n\n一个寡言的挑水人没有劝架。她在井边摆了三只空桶，分别刻上饮用、牲口、灌溉，又在墙上写下每天水位、取水量和谁能在什么情况下破例。大家嫌这像把邻居当贼。可第三天，井水比预想少一半，墙上的数字让他们第一次看见：谁的需要不能等，谁的用水可以晚一晚。\n\n井没有因此变深，争论也没有消失。但人们先谈三只桶，再谈谁该让步。原来真正让人厮打的，往往不是少掉的水，而是没人敢把稀缺、顺序和例外摆到同一堵墙上。",
  T18: "两张戏票\n\n说书人棠月要讲新运河，准备了二十页数字：河多长，船多快，税会少多少。她在空厅里练得流畅，开讲时却见台下的米商低头算货期，赶考姑娘盯着雨伞，守渡口的孩子在桌下折纸船。\n\n她照着稿子讲完，掌声很轻。散场时米商问的不是河，而是明天会不会断粮；姑娘问渡船要不要停；孩子只问父亲是不是还要穿湿鞋回家。棠月觉得他们不懂大事，第二天又补了更多数字。\n\n老演员把两张没卖出的戏票放在她面前，一张写“河”，一张写“回家”。他说，观众不是不愿听河；他们只是不知道河为什么要走进自己的晚饭、考试和一双湿鞋。\n\n第三次开讲，棠月从七岁孩子在渡口等父亲说起，等父亲的湿鞋在门槛上滴成一小滩水，才让运河出场。散场后，米商问哪段堤最该先修，姑娘问船期如何查。数字没有少，只是终于有了可以停靠的人。",
  T19: "第二杯茶\n\n旅行商人顾川以看人快著称。在北城见客人沉默，他便认定冷淡；在南市听人抢着说，他便认定浮躁。靠这些判断，他少等许多无用的会，也错过一些没写进账本的生意。\n\n山城的布商请他喝茶，全程只添水，很少报价。顾川以为对方没有诚意，当晚就叫伙计收货。临走时，他看见主人把第二杯茶推到自己面前，又把手从契约上拿开，像在等什么。\n\n客栈老板说，山城人第一次谈事不急着表态；第二杯茶不是客套，是在等客人把真正害怕的条件说出来。顾川本想笑，说买卖只看价钱。第二天却还是回去，先问对方最担心哪一段交货。布商取出一张被雨打湿的旧契约：上次不是价钱害他赔钱，而是南路塌方后没人肯改期。\n\n顾川改成分批交货，少赚了一点，却换来往后三年的订单。后来他仍相信第一眼有用，只是在第二杯茶之前，不再急着把自己的习惯当成别人的定义。"
};

const state = {
  selectedMonthId: "",
  library: {
    timeline: {},
    months: []
  },
  openBlockId: "",
  materialReader: null,
  libraryLoaded: false,
  accessGranted: false,
  editMode: false,
  cloudReady: false,
  cloudSaveTimer: 0,
  knowledge: {
    loaded: false,
    loading: false,
    notes: [],
    selectedNoteId: "",
    markdownCache: {},
    filters: {
      query: ""
    }
  }
};

const $ = (selector) => document.querySelector(selector);

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function copyPlainText(value = "") {
  const text = String(value || "");
  if (!text) return false;
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.setAttribute("readonly", "");
    textArea.style.position = "fixed";
    textArea.style.left = "-9999px";
    textArea.style.top = "0";
    document.body.append(textArea);
    textArea.focus();
    textArea.select();
    try {
      return document.execCommand("copy");
    } catch {
      return false;
    } finally {
      textArea.remove();
    }
  }
}

function normalize(value) {
  return String(value || "").trim().toLowerCase();
}

function slugify(value) {
  return normalize(value)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function parseMonth(monthKey) {
  const [year, month] = String(monthKey || "").split("-").map(Number);
  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) return null;
  return new Date(Date.UTC(year, month - 1, 1));
}

function monthKeyFromDate(value) {
  const match = String(value || "").match(/^(\d{4})-(\d{2})/);
  return match ? `${match[1]}-${match[2]}` : "";
}

function addMonths(monthKey, amount) {
  const date = parseMonth(monthKey);
  if (!date) return "";
  date.setUTCMonth(date.getUTCMonth() + amount);
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

function monthRange(startMonth, endMonth) {
  const months = [];
  let current = startMonth;
  let guard = 0;
  while (current && current <= endMonth && guard < 60) {
    months.push(current);
    current = addMonths(current, 1);
    guard += 1;
  }
  return months;
}

function formatMonth(monthKey, options = { month: "long", year: "numeric" }) {
  const date = parseMonth(monthKey);
  if (!date) return monthKey || "Month";
  return date.toLocaleDateString("en", { timeZone: "UTC", ...options });
}

function monthId(month) {
  return month.id || month.month || slugify(month.title || "emba-month");
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function isEditMode() {
  return state.editMode;
}

function normalizeMaterial(item) {
  if (typeof item === "string") return { title: item, type: "", file: "", notes: "" };
  return {
    title: item?.title || item?.name || "Material",
    type: item?.type || "",
    file: item?.file || item?.href || "",
    notes: item?.notes || item?.summary || ""
  };
}

function normalizeMemory(item, monthKey) {
  if (typeof item === "string") return { title: item, image: "", caption: "", month: monthKey };
  return {
    title: item?.title || "Memory",
    image: item?.image || item?.photo || item?.file || "",
    caption: item?.caption || item?.notes || "",
    month: item?.month || monthKey
  };
}

function normalizeMarkdown(value) {
  return String(value || "");
}

function normalizeRevision(value = 0) {
  const revision = Number(value || 0);
  if (!Number.isFinite(revision)) return 0;
  return Math.max(0, Math.min(9999, Math.trunc(revision)));
}

function bumpRevision(month, field) {
  month[field] = Math.min(9999, normalizeRevision(month[field]) + 1);
}

function bumpInputRevision(target, month, field) {
  if (target.dataset.revisionBumped === "true") return;
  target.dataset.revisionBumped = "true";
  bumpRevision(month, field);
}

function normalizeThinkingReviewStatus(value = "") {
  const status = String(value || "").trim().toLowerCase();
  return THINKING_REVIEW_STATUSES.includes(status) ? status : "pending";
}

function normalizeReviewDate(value = "") {
  const date = String(value || "").trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : "";
}

function normalizeThinkingItem(item) {
  if (typeof item === "string") return item.trim();
  if (!item || typeof item !== "object") return "";

  const normalizedItem = {
    id: String(item.id || "").trim(),
    kind: String(item.kind || item.type || "思考").trim(),
    title: String(item.title || item.body || item.original || "").trim(),
    date: String(item.date || "").trim(),
    source: String(item.source || "").trim(),
    position: String(item.position || "").trim(),
    original: String(item.original || item.raw || "").trim(),
    context: String(item.context || "").trim(),
    fable: String(item.fable || item.allegory || JULY_THINKING_FABLES[item.id] || "").trim(),
    reconstruction: String(item.reconstruction || item.completedArgument || item.completed || "").trim(),
    evidenceBoundary: String(item.evidenceBoundary || item.boundary || "").trim(),
    reviewPrompt: String(item.reviewPrompt || item.review || "").trim(),
    reviewNotes: String(item.reviewNotes || "").trim(),
    followUp: String(item.followUp || item.followup || "").trim(),
    followUpNotes: String(item.followUpNotes || "").trim(),
    learningReflection: String(item.learningReflection || item.reflection || "").trim(),
    learningNotes: String(item.learningNotes || "").trim(),
    reviewStatus: normalizeThinkingReviewStatus(item.reviewStatus || item.status),
    reviewDate: normalizeReviewDate(item.reviewDate || item.reviewedAt),
    confidence: String(item.confidence || "").trim().toLowerCase(),
    image: String(item.image || item.sourceImage || "").trim()
  };

  return normalizedItem.title || normalizedItem.original ? normalizedItem : "";
}

function normalizeThinkingQuestions(value) {
  return asArray(value).map(normalizeThinkingItem).filter(Boolean);
}

function thinkingItemText(item) {
  if (typeof item === "string") return item;
  if (!item || typeof item !== "object") return "";
  return [
    item.id,
    item.kind,
    item.title,
    item.date,
    item.source,
    item.position,
    item.original,
    item.context,
    item.fable,
    item.reconstruction
  ].filter(Boolean).join(" ");
}

function thinkingItemHasContent(item) {
  return hasTextContent(thinkingItemText(item));
}

function normalizeMonth(month) {
  const monthKey = month.month || monthKeyFromDate(month.date) || DEFAULT_START_MONTH;
  const materials = asArray(month.materials || month.material || month.documents)
    .map(normalizeMaterial)
    .filter(materialHasContent);
  const memories = asArray(month.memoryMoment || month.memoryMoments || month.photos).map((item) => normalizeMemory(item, monthKey));
  return {
    id: month.id || monthKey,
    month: monthKey,
    title: month.title || formatMonth(monthKey),
    materialsRevision: normalizeRevision(month.materialsRevision),
    reflectionRevision: normalizeRevision(month.reflectionRevision),
    followUpRevision: normalizeRevision(month.followUpRevision),
    markdownRevision: normalizeRevision(month.markdownRevision),
    memoryRevision: normalizeRevision(month.memoryRevision),
    materials,
    reflection: month.reflection || month.notes || "",
    thinkingQuestions: normalizeThinkingQuestions(month.thinkingQuestions || month.questions || month.thoughts),
    followUpPoints: normalizeThinkingQuestions(month.followUpPoints || month.followUps || month.openQuestions),
    markdown: normalizeMarkdown(month.reviewedMarkdown || month.markdown || month.md || month.searchNotes),
    memoryMoment: memories
  };
}

function legacyDaysToMonths(days = []) {
  const grouped = new Map();
  days.forEach((day) => {
    const monthKey = monthKeyFromDate(day.date);
    if (!monthKey) return;
    const entry = grouped.get(monthKey) || {
      id: monthKey,
      month: monthKey,
      title: formatMonth(monthKey),
      materialsRevision: 0,
      reflectionRevision: 0,
      followUpRevision: 0,
      markdownRevision: 0,
      memoryRevision: 0,
      materials: [],
      reflection: "",
      thinkingQuestions: [],
      followUpPoints: [],
      markdown: "",
      memoryMoment: []
    };
    entry.materials.push(...asArray(day.documents).map(normalizeMaterial));
    if (!entry.reflection && Array.isArray(day.notes) && day.notes[0]) {
      entry.reflection = day.notes[0].body || day.notes[0].title || "";
    }
    grouped.set(monthKey, entry);
  });
  return [...grouped.values()];
}

function hasTextContent(value) {
  return String(value || "").trim().length > 0;
}

function materialHasContent(item = {}) {
  if (HIDDEN_MATERIAL_FILES.has(String(item.file || ""))) return false;
  return hasTextContent(item.file)
    || hasTextContent(item.notes)
    || (hasTextContent(item.title) && item.title !== "Material");
}

function memoryHasContent(item = {}) {
  return hasTextContent(item.image);
}

function monthHasContent(month = {}) {
  return asArray(month.materials).some(materialHasContent)
    || hasTextContent(month.reflection)
    || asArray(month.thinkingQuestions).some(thinkingItemHasContent)
    || asArray(month.followUpPoints).some(thinkingItemHasContent)
    || hasTextContent(month.markdown)
    || asArray(month.memoryMoment).some(memoryHasContent);
}

function timelineMonths() {
  return state.library.months
    .filter(monthHasContent)
    .sort((a, b) => String(a.month || "").localeCompare(String(b.month || "")));
}

function createEmptyMonth(monthKey) {
  return {
    id: monthKey,
    month: monthKey,
    title: formatMonth(monthKey),
    materialsRevision: 0,
    reflectionRevision: 0,
    followUpRevision: 0,
    markdownRevision: 0,
    memoryRevision: 0,
    materials: [],
    reflection: "",
    thinkingQuestions: [],
    followUpPoints: [],
    markdown: "",
    memoryMoment: []
  };
}

function sortLibraryMonths() {
  state.library.months.sort((a, b) => String(a.month || "").localeCompare(String(b.month || "")));
}

function editableMonth() {
  const current = selectedMonth();
  const monthKey = current?.month || DEFAULT_START_MONTH;
  let month = state.library.months.find((item) => item.month === monthKey);
  if (!month) {
    month = createEmptyMonth(monthKey);
    state.library.months.push(month);
    sortLibraryMonths();
  }
  month.materials = asArray(month.materials);
  month.memoryMoment = asArray(month.memoryMoment);
  if (typeof month.reflection !== "string") month.reflection = "";
  month.thinkingQuestions = normalizeThinkingQuestions(month.thinkingQuestions);
  month.followUpPoints = normalizeThinkingQuestions(month.followUpPoints);
  if (typeof month.markdown !== "string") month.markdown = "";
  ["materialsRevision", "reflectionRevision", "followUpRevision", "markdownRevision", "memoryRevision"]
    .forEach((field) => {
      month[field] = normalizeRevision(month[field]);
    });
  return month;
}

function normalizeLibraryData(library = {}) {
  const months = Array.isArray(library.months)
    ? library.months.map(normalizeMonth)
    : legacyDaysToMonths(library.days || library.items);
  return {
    timeline: library.timeline || {},
    months
  };
}

function savedLibrary() {
  try {
    const saved = JSON.parse(localStorage.getItem(EMBA_LIBRARY_KEY) || "null");
    if (!saved || !Array.isArray(saved.months)) return null;
    return normalizeLibraryData(saved);
  } catch {
    return null;
  }
}

function compactTextLength(value) {
  return String(value || "").replace(/\s+/g, "").length;
}

function richerText(baseValue, overlayValue) {
  const baseText = normalizeMarkdown(baseValue);
  const overlayText = normalizeMarkdown(overlayValue);
  if (!hasTextContent(baseText)) return overlayText;
  if (!hasTextContent(overlayText)) return baseText;
  return compactTextLength(baseText) > compactTextLength(overlayText) * 1.35 ? baseText : overlayText;
}

function mergeMaterialLists(baseMaterials = [], overlayMaterials = []) {
  const seen = new Set();
  return [...asArray(baseMaterials), ...asArray(overlayMaterials)]
    .map(normalizeMaterial)
    .filter(materialHasContent)
    .filter((item) => {
      const key = `${normalize(item.file)}|${normalize(item.title)}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

function mergeThinkingLists(baseItems = [], overlayItems = []) {
  const base = normalizeThinkingQuestions(baseItems);
  const overlay = normalizeThinkingQuestions(overlayItems);
  const baseIsStructured = base.some((item) => typeof item === "object");
  if (baseIsStructured) {
    const merged = base.map((item) => typeof item === "object" ? { ...item } : item);
    const indexesById = new Map(merged
      .map((item, index) => [typeof item === "object" ? normalize(item.id) : "", index])
      .filter(([id]) => id));
    overlay.filter((item) => typeof item === "object").forEach((item) => {
      const key = normalize(item.id);
      const existingIndex = indexesById.get(key);
      if (existingIndex === undefined) {
        indexesById.set(key, merged.length);
        merged.push(item);
        return;
      }
      merged[existingIndex] = {
        ...merged[existingIndex],
        reviewNotes: item.reviewNotes,
        followUpNotes: item.followUpNotes,
        learningNotes: item.learningNotes,
        reviewStatus: item.reviewStatus,
        reviewDate: item.reviewDate
      };
    });
    return merged;
  }

  const seen = new Set();
  return [...base, ...overlay]
    .filter((item) => {
      const key = typeof item === "object" && item.id
        ? `id:${normalize(item.id)}`
        : normalize(thinkingItemText(item));
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

function revisionWinner(baseMonth = {}, overlayMonth = {}, field = "") {
  const baseRevision = normalizeRevision(baseMonth[field]);
  const overlayRevision = normalizeRevision(overlayMonth[field]);
  if (baseRevision === overlayRevision) return "";
  return baseRevision > overlayRevision ? "base" : "overlay";
}

function mergeMonthData(baseMonth = {}, overlayMonth = {}) {
  const materialsWinner = revisionWinner(baseMonth, overlayMonth, "materialsRevision");
  const reflectionWinner = revisionWinner(baseMonth, overlayMonth, "reflectionRevision");
  const followUpWinner = revisionWinner(baseMonth, overlayMonth, "followUpRevision");
  const markdownWinner = revisionWinner(baseMonth, overlayMonth, "markdownRevision");
  const memoryWinner = revisionWinner(baseMonth, overlayMonth, "memoryRevision");
  const baseThinking = normalizeThinkingQuestions(baseMonth.thinkingQuestions);
  const baseThinkingIsStructured = baseThinking.some((item) => typeof item === "object");
  const exactMaterials = (items) => asArray(items).map(normalizeMaterial).filter(materialHasContent);
  const exactMemories = (items) => asArray(items).map((item) => normalizeMemory(item, overlayMonth.month || baseMonth.month));
  return {
    ...baseMonth,
    ...overlayMonth,
    title: overlayMonth.title || baseMonth.title,
    materials: materialsWinner
      ? exactMaterials(materialsWinner === "base" ? baseMonth.materials : overlayMonth.materials)
      : mergeMaterialLists(baseMonth.materials, overlayMonth.materials),
    materialsRevision: Math.max(normalizeRevision(baseMonth.materialsRevision), normalizeRevision(overlayMonth.materialsRevision)),
    reflection: reflectionWinner
      ? normalizeMarkdown(reflectionWinner === "base" ? baseMonth.reflection : overlayMonth.reflection)
      : richerText(baseMonth.reflection, overlayMonth.reflection),
    reflectionRevision: Math.max(normalizeRevision(baseMonth.reflectionRevision), normalizeRevision(overlayMonth.reflectionRevision)),
    thinkingQuestions: baseThinkingIsStructured
      ? mergeThinkingLists(baseMonth.thinkingQuestions, overlayMonth.thinkingQuestions)
      : reflectionWinner
        ? normalizeThinkingQuestions(reflectionWinner === "base" ? baseMonth.thinkingQuestions : overlayMonth.thinkingQuestions)
        : mergeThinkingLists(baseMonth.thinkingQuestions, overlayMonth.thinkingQuestions),
    followUpPoints: followUpWinner
      ? normalizeThinkingQuestions(followUpWinner === "base" ? baseMonth.followUpPoints : overlayMonth.followUpPoints)
      : mergeThinkingLists(baseMonth.followUpPoints, overlayMonth.followUpPoints),
    followUpRevision: Math.max(normalizeRevision(baseMonth.followUpRevision), normalizeRevision(overlayMonth.followUpRevision)),
    markdown: markdownWinner
      ? normalizeMarkdown(markdownWinner === "base" ? baseMonth.markdown : overlayMonth.markdown)
      : richerText(baseMonth.markdown, overlayMonth.markdown),
    markdownRevision: Math.max(normalizeRevision(baseMonth.markdownRevision), normalizeRevision(overlayMonth.markdownRevision)),
    memoryMoment: memoryWinner
      ? exactMemories(memoryWinner === "base" ? baseMonth.memoryMoment : overlayMonth.memoryMoment)
      : asArray(overlayMonth.memoryMoment).length
        ? exactMemories(overlayMonth.memoryMoment)
        : exactMemories(baseMonth.memoryMoment),
    memoryRevision: Math.max(normalizeRevision(baseMonth.memoryRevision), normalizeRevision(overlayMonth.memoryRevision))
  };
}

function mergeLibrary(baseLibrary, saved) {
  if (!saved) return baseLibrary;
  const months = new Map(baseLibrary.months.map((month) => [month.month, month]));
  saved.months.forEach((month) => {
    const baseMonth = months.get(month.month);
    months.set(month.month, baseMonth ? mergeMonthData(baseMonth, month) : month);
  });
  return {
    timeline: { ...baseLibrary.timeline, ...saved.timeline },
    months: [...months.values()].sort((a, b) => String(a.month || "").localeCompare(String(b.month || "")))
  };
}

function setSyncStatus(message = "", tone = "") {
  const status = $("#embaSyncStatus");
  if (!status) return;
  status.textContent = message;
  status.dataset.tone = tone;
}

function updateEditModeControl() {
  const button = $("#embaEditToggle");
  if (!button) return;
  const granted = hasEmbaAccess();
  button.hidden = !granted;
  button.setAttribute("aria-pressed", String(isEditMode()));
  button.textContent = isEditMode() ? "Editing" : "Edit mode";
  button.setAttribute("aria-label", isEditMode() ? "Turn off EMBA editing" : "Turn on EMBA editing");
  document.body.classList.toggle("emba-editing", isEditMode());
}

function setEditMode(enabled) {
  state.editMode = Boolean(enabled);
  updateEditModeControl();
  renderMonthDetail(selectedMonth());
}

function openMemoryLightbox(image, label = "") {
  const lightbox = $("#embaLightbox");
  const photo = $("#embaLightboxImage");
  if (!lightbox || !photo || !image) return;
  photo.src = image;
  photo.alt = label || "EMBA memory photo";
  lightbox.hidden = false;
  lightbox.setAttribute("aria-hidden", "false");
  document.body.classList.add("emba-lightbox-open");
}

function closeMemoryLightbox() {
  const lightbox = $("#embaLightbox");
  const photo = $("#embaLightboxImage");
  if (!lightbox || !photo) return;
  lightbox.hidden = true;
  lightbox.setAttribute("aria-hidden", "true");
  photo.removeAttribute("src");
  photo.alt = "";
  document.body.classList.remove("emba-lightbox-open");
}

function libraryForCloud() {
  return {
    updated: new Date().toISOString(),
    timeline: state.library.timeline,
    months: state.library.months.map((month) => ({
      ...month,
      memoryMoment: asArray(month.memoryMoment).map((item) => ({
        ...item,
        image: String(item.image || "").startsWith("data:") ? "" : item.image
      }))
    }))
  };
}

function persistLocalLibrary() {
  try {
    localStorage.setItem(EMBA_LIBRARY_KEY, JSON.stringify({
      updated: new Date().toISOString(),
      timeline: state.library.timeline,
      months: state.library.months
    }));
  } catch (error) {
    console.warn("Could not save EMBA edits locally.", error);
  }
}

async function syncLibraryToCloud() {
  if (!state.cloudReady) return;
  setSyncStatus("Saving");
  try {
    const response = await fetch(EMBA_LIBRARY_API, {
      method: "PUT",
      credentials: "same-origin",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(libraryForCloud())
    });
    if (!response.ok) throw new Error(`Cloud save failed (${response.status})`);
    setSyncStatus("Saved");
  } catch (error) {
    console.warn("Could not save EMBA library to cloud.", error);
    setSyncStatus("Local saved", "warn");
  }
}

function queueCloudSave() {
  if (!state.cloudReady) {
    setSyncStatus("Local saved", "warn");
    return;
  }
  window.clearTimeout(state.cloudSaveTimer);
  state.cloudSaveTimer = window.setTimeout(syncLibraryToCloud, CLOUD_SAVE_DELAY_MS);
}

function saveLibrary() {
  persistLocalLibrary();
  queueCloudSave();
}

function cleanStringList(value) {
  if (Array.isArray(value)) return value.map((item) => String(item || "").trim()).filter(Boolean);
  if (!value) return [];
  return String(value).split(",").map((item) => item.trim()).filter(Boolean);
}

function normalizeKnowledgeNote(note = {}) {
  const year = Number(note.year || monthKeyFromDate(note.date).slice(0, 4));
  return {
    id: note.id || slugify(note.title || note.md_file || "emba-note"),
    title: note.title || "Untitled EMBA note",
    type: note.type || "note",
    program: note.program || "EMBA",
    school: note.school || "Maastricht University",
    course: note.course || "",
    module: note.module || "",
    session: note.session || "",
    date: note.date || "",
    year: Number.isFinite(year) ? year : "",
    month: note.month || monthKeyFromDate(note.date),
    source_type: note.source_type || "",
    source_file: note.source_file || note.original_file || "",
    source_files: cleanStringList(note.source_files || note.original_files),
    converted_from: note.converted_from || "",
    md_file: note.md_file || note.file || "",
    visibility: note.visibility || "private",
    status: note.status || "active",
    tags: cleanStringList(note.tags),
    keywords: cleanStringList(note.keywords),
    summary: note.summary || "",
    related_topics: cleanStringList(note.related_topics),
    rag_include: note.rag_include !== false,
    search_text: note.search_text || "",
    search_body: note.search_body || ""
  };
}

function setKnowledgeStatus(message = "", tone = "") {
  const status = $("#embaKnowledgeStatus");
  if (!status) return;
  status.textContent = message;
  status.dataset.tone = tone;
  status.hidden = !message;
}

function liveMonthSearchText(note = {}) {
  if (!note.month) return "";
  const month = state.library.months.find((item) => item.month === note.month);
  if (!month) return "";

  const thinkingItems = normalizeThinkingQuestions(month.thinkingQuestions);
  if (note.id === "emba-2026-07-personal-marker-original-extract") {
    return thinkingItems
      .map((item) => typeof item === "object"
        ? [item.id, item.original, item.context, item.source, item.position].filter(Boolean).join(" ")
        : item)
      .join(" ");
  }
  if (note.id === "emba-2026-07-questions-and-reflections-review") {
    return thinkingItems.map(thinkingItemText).join(" ");
  }
  if (note.type === "personal_reflection") {
    return [month.reflection, ...thinkingItems.map(thinkingItemText)].join(" ");
  }
  if (note.type === "course_note") return month.markdown;
  if (note.type === "monthly_index") {
    return [month.reflection, month.markdown].join(" ");
  }
  return "";
}

function noteSearchBlob(note = {}) {
  return [
    note.title,
    note.type,
    note.course,
    note.module,
    note.session,
    note.date,
    note.year,
    note.month,
    note.source_type,
    note.converted_from,
    note.summary,
    note.tags.join(" "),
    note.keywords.join(" "),
    note.related_topics.join(" "),
    note.search_text,
    note.search_body,
    liveMonthSearchText(note)
  ].join(" ").toLowerCase();
}

function noteMatchesKnowledgeFilters(note = {}) {
  const filters = state.knowledge.filters;
  const terms = normalize(filters.query).split(/\s+/).filter(Boolean);
  const searchable = noteSearchBlob(note);
  return !terms.length || terms.every((term) => searchable.includes(term));
}

function filteredKnowledgeNotes() {
  if (!normalize(state.knowledge.filters.query)) return [];
  return state.knowledge.notes
    .filter((note) => note.visibility !== "public" ? true : note.status !== "deleted")
    .filter((note) => note.status !== "deleted")
    .filter(noteMatchesKnowledgeFilters)
    .sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")) || a.title.localeCompare(b.title));
}

function formatKnowledgeType(value = "") {
  return String(value || "note").replaceAll("_", " ");
}

function formatKnowledgeMonth(value = "") {
  return value ? `${formatMonth(value)} (${value})` : "";
}

function renderKnowledgeControls() {
  const input = $("#embaKnowledgeSearch");
  if (input && input.value !== state.knowledge.filters.query) {
    input.value = state.knowledge.filters.query;
  }
}

function noteMetaText(note = {}) {
  return [
    note.month,
    note.course,
    formatKnowledgeType(note.type),
    note.source_type
  ].filter(Boolean).join(" · ");
}

function renderKnowledgeResult(note, isSelected) {
  const sourceCount = note.source_files.length || (note.source_file ? 1 : 0);
  return `
    <article class="emba-knowledge-result${isSelected ? " selected" : ""}">
      <div class="emba-knowledge-result-main">
        <span class="emba-knowledge-result-title">${escapeHtml(note.title)}</span>
        <span class="emba-knowledge-result-meta">${escapeHtml(noteMetaText(note))}</span>
      </div>
      <div class="emba-knowledge-result-actions">
        ${note.md_file ? `<a class="emba-file-link" href="${escapeHtml(note.md_file)}" target="_blank" rel="noopener noreferrer">Open MD</a>` : ""}
        ${note.source_file ? `<a class="emba-file-link" href="${escapeHtml(note.source_file)}" target="_blank" rel="noopener noreferrer">Open source${sourceCount > 1 ? ` (${sourceCount})` : ""}</a>` : ""}
        ${note.month ? `<button class="emba-text-btn" type="button" data-knowledge-month="${escapeHtml(note.month)}">Show month</button>` : ""}
      </div>
    </article>
  `;
}

function renderKnowledgeResults() {
  const results = $("#embaKnowledgeResults");
  if (!results) return;
  const hasQuery = Boolean(normalize(state.knowledge.filters.query));
  if (!hasQuery) {
    state.knowledge.selectedNoteId = "";
    setKnowledgeStatus("");
    results.innerHTML = "";
    results.hidden = true;
    return;
  }
  const notes = filteredKnowledgeNotes();
  const count = notes.length;
  results.hidden = false;
  setKnowledgeStatus(state.knowledge.loaded ? `${count} note${count === 1 ? "" : "s"} found.` : "Loading knowledge base.");
  results.innerHTML = count ? notes.map((note) => renderKnowledgeResult(note, note.id === state.knowledge.selectedNoteId)).join("")
    : `<div class="emba-empty-state">No EMBA notes match these filters.</div>`;
}

function renderKnowledgeBase() {
  renderKnowledgeControls();
  renderKnowledgeResults();
}

function safeMarkdownLink(value = "", basePath = "") {
  const url = String(value || "").trim();
  if (!url || /^javascript:/i.test(url) || /^data:/i.test(url)) return "";
  if (url.startsWith("#")) return url;
  if (url.startsWith("/") && !url.startsWith("//") && !url.includes("..")) return url;
  if (/^https?:\/\//i.test(url)) return url;
  if (!basePath) return url;
  try {
    const baseUrl = new URL(basePath, window.location.origin);
    return new URL(url, baseUrl).pathname;
  } catch {
    return "";
  }
}

function markdownInline(value = "", basePath = "") {
  return escapeHtml(value)
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, label, url) => {
      const safeUrl = safeMarkdownLink(url, basePath);
      return safeUrl ? `<a href="${escapeHtml(safeUrl)}" target="_blank" rel="noopener noreferrer">${label}</a>` : label;
    });
}

function splitFrontmatter(markdown = "") {
  const source = String(markdown || "");
  if (!source.startsWith("---\n")) return { frontmatter: "", body: source };
  const closeIndex = source.indexOf("\n---\n", 4);
  if (closeIndex === -1) return { frontmatter: "", body: source };
  return {
    frontmatter: source.slice(4, closeIndex).trim(),
    body: source.slice(closeIndex + 5).trimStart()
  };
}

function markdownToHtml(markdown = "", basePath = "") {
  const { body } = splitFrontmatter(markdown);
  const lines = body.split(/\r?\n/);
  const html = [];
  let listOpen = false;
  let orderedListOpen = false;
  let codeOpen = false;
  let paragraph = [];
  let tableRows = [];

  const flushParagraph = () => {
    if (!paragraph.length) return;
    html.push(`<p>${markdownInline(paragraph.join(" "), basePath)}</p>`);
    paragraph = [];
  };
  const closeList = () => {
    if (!listOpen) return;
    html.push("</ul>");
    listOpen = false;
  };
  const closeOrderedList = () => {
    if (!orderedListOpen) return;
    html.push("</ol>");
    orderedListOpen = false;
  };
  const tableCells = (line) => String(line || "")
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim());
  const isTableSeparator = (line) => /^\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?$/.test(String(line || "").trim());
  const flushTable = () => {
    if (!tableRows.length) return;
    const rows = tableRows.slice();
    tableRows = [];
    const hasHeader = rows.length > 1 && isTableSeparator(rows[1]);
    const header = hasHeader ? tableCells(rows[0]) : [];
    const bodyRows = (hasHeader ? rows.slice(2) : rows).map(tableCells);
    html.push("<div class=\"emba-markdown-table-wrap\"><table>");
    if (header.length) {
      html.push(`<thead><tr>${header.map((cell) => `<th>${markdownInline(cell, basePath)}</th>`).join("")}</tr></thead>`);
    }
    html.push("<tbody>");
    bodyRows.forEach((cells) => {
      html.push(`<tr>${cells.map((cell) => `<td>${markdownInline(cell, basePath)}</td>`).join("")}</tr>`);
    });
    html.push("</tbody></table></div>");
  };

  lines.forEach((line) => {
    if (line.trim().startsWith("```")) {
      flushParagraph();
      closeList();
      closeOrderedList();
      flushTable();
      if (codeOpen) {
        html.push("</code></pre>");
        codeOpen = false;
      } else {
        html.push("<pre><code>");
        codeOpen = true;
      }
      return;
    }
    if (codeOpen) {
      html.push(escapeHtml(line));
      return;
    }
    if (!line.trim()) {
      flushParagraph();
      closeList();
      closeOrderedList();
      flushTable();
      return;
    }
    if (/^\s*\|.+\|\s*$/.test(line)) {
      flushParagraph();
      closeList();
      closeOrderedList();
      tableRows.push(line);
      return;
    }
    flushTable();
    const heading = line.match(/^(#{1,4})\s+(.+)$/);
    if (heading) {
      flushParagraph();
      closeList();
      closeOrderedList();
      const level = Math.min(heading[1].length + 2, 6);
      html.push(`<h${level}>${markdownInline(heading[2], basePath)}</h${level}>`);
      return;
    }
    const bullet = line.match(/^\s*[-*]\s+(.+)$/);
    if (bullet) {
      flushParagraph();
      closeOrderedList();
      if (!listOpen) {
        html.push("<ul>");
        listOpen = true;
      }
      html.push(`<li>${markdownInline(bullet[1], basePath)}</li>`);
      return;
    }
    const numbered = line.match(/^\s*\d+\.\s+(.+)$/);
    if (numbered) {
      flushParagraph();
      closeList();
      if (!orderedListOpen) {
        html.push("<ol>");
        orderedListOpen = true;
      }
      html.push(`<li>${markdownInline(numbered[1], basePath)}</li>`);
      return;
    }
    paragraph.push(line.trim());
  });

  flushParagraph();
  closeList();
  closeOrderedList();
  flushTable();
  if (codeOpen) html.push("</code></pre>");
  return html.join("\n");
}

function renderKnowledgePreview(note, markdown) {
  const preview = $("#embaKnowledgePreview");
  if (!preview) return;
  preview.innerHTML = `
    <div class="emba-knowledge-preview-head">
      <div>
        <span class="emba-month-kicker">${escapeHtml(formatKnowledgeMonth(note.month) || "EMBA note")}</span>
        <h3>${escapeHtml(note.title)}</h3>
        <p>${escapeHtml(note.summary || noteMetaText(note))}</p>
      </div>
      <div class="emba-knowledge-preview-actions">
        ${note.md_file ? `<a class="emba-file-link" href="${escapeHtml(note.md_file)}" target="_blank" rel="noopener noreferrer">Open MD</a>` : ""}
        ${note.source_file ? `<a class="emba-file-link" href="${escapeHtml(note.source_file)}" target="_blank" rel="noopener noreferrer">Open source</a>` : ""}
      </div>
    </div>
    <div class="emba-knowledge-preview-meta">
      ${[note.course, formatKnowledgeType(note.type), note.source_type, note.rag_include ? "RAG included" : "RAG excluded"].filter(Boolean).map((item) => `<span>${escapeHtml(item)}</span>`).join("")}
    </div>
    <div class="emba-markdown-rendered">${markdownToHtml(markdown, note.md_file)}</div>
  `;
}

async function openKnowledgeNote(noteId) {
  const note = state.knowledge.notes.find((item) => item.id === noteId);
  if (!note || !note.md_file) return;
  state.knowledge.selectedNoteId = note.id;
  renderKnowledgeResults();
  setKnowledgeStatus(`Opening ${note.title}.`);
  try {
    if (!state.knowledge.markdownCache[note.md_file]) {
      const response = await fetch(note.md_file, { cache: "no-store" });
      if (!response.ok) throw new Error(`Could not load Markdown (${response.status})`);
      state.knowledge.markdownCache[note.md_file] = await response.text();
    }
    renderKnowledgePreview(note, state.knowledge.markdownCache[note.md_file]);
    setKnowledgeStatus(`${filteredKnowledgeNotes().length} note${filteredKnowledgeNotes().length === 1 ? "" : "s"} found.`);
  } catch (error) {
    const preview = $("#embaKnowledgePreview");
    if (preview) preview.innerHTML = `<p class="emba-empty-copy">${escapeHtml(error.message)}</p>`;
    setKnowledgeStatus("Could not load Markdown preview.", "warn");
  }
}

async function loadKnowledgeBase() {
  if (state.knowledge.loading || state.knowledge.loaded) return;
  state.knowledge.loading = true;
  if (normalize(state.knowledge.filters.query)) setKnowledgeStatus("Loading knowledge base.");
  try {
    const response = await fetch(EMBA_KNOWLEDGE_INDEX, { cache: "no-store" });
    if (!response.ok) throw new Error(`Could not load knowledge index (${response.status})`);
    const payload = await response.json();
    state.knowledge.notes = asArray(payload.notes).map(normalizeKnowledgeNote).filter((note) => note.md_file);
    renderKnowledgeBase();
    const batchSize = 6;
    for (let index = 0; index < state.knowledge.notes.length; index += batchSize) {
      const batch = state.knowledge.notes.slice(index, index + batchSize);
      await Promise.all(batch.map(async (note) => {
        try {
          const response = await fetch(note.md_file, { cache: "no-store" });
          if (!response.ok) return;
          const markdown = await response.text();
          state.knowledge.markdownCache[note.md_file] = markdown;
          note.search_body = splitFrontmatter(markdown).body;
        } catch {
          // Metadata search remains available when one Markdown file cannot load.
        }
      }));
    }
    state.knowledge.loaded = true;
    renderKnowledgeBase();
  } catch (error) {
    setKnowledgeStatus(error.message, "warn");
  } finally {
    state.knowledge.loading = false;
  }
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}

async function imageFileToDataUrl(file) {
  if (!file || !file.type.startsWith("image/")) return "";
  const rawDataUrl = await readFileAsDataUrl(file);
  try {
    const image = await loadImage(rawDataUrl);
    const maxSide = 1400;
    const scale = Math.min(1, maxSide / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    const context = canvas.getContext("2d");
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.84);
  } catch {
    return rawDataUrl;
  }
}

async function uploadEmbaFile(file, month, kind) {
  if (!file || !state.cloudReady) return null;
  const formData = new FormData();
  formData.append("file", file);
  formData.append("month", month);
  formData.append("kind", kind);
  setSyncStatus("Uploading");
  try {
    const response = await fetch(EMBA_UPLOAD_API, {
      method: "POST",
      credentials: "same-origin",
      body: formData
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error || `Upload failed (${response.status})`);
    setSyncStatus("Uploaded");
    return payload;
  } catch (error) {
    console.warn("Could not upload EMBA file to cloud.", error);
    setSyncStatus("Upload kept local", "warn");
    return null;
  }
}

function selectedMonth() {
  const months = timelineMonths();
  return months.find((month) => monthId(month) === state.selectedMonthId) || months[0] || null;
}

function renderTimeline() {
  const timeline = $("#embaTimeline");
  if (!timeline) return;
  const months = timelineMonths();
  if (!months.length) {
    timeline.innerHTML = `<div class="emba-empty-state">No EMBA month has content yet.</div>`;
    state.selectedMonthId = "";
    renderMonthDetail(null);
    return;
  }
  if (!months.some((month) => monthId(month) === state.selectedMonthId)) {
    state.selectedMonthId = monthId(months[0]);
  }

  timeline.innerHTML = months.map((month) => {
    const id = monthId(month);
    const isActive = state.selectedMonthId === id;
    const monthName = formatMonth(month.month, { month: "short" });
    const year = formatMonth(month.month, { year: "numeric" });
    return `
      <button class="emba-timeline-item${isActive ? " active" : ""}" type="button" data-month-id="${escapeHtml(id)}" aria-pressed="${isActive}"${isActive ? ' aria-current="date"' : ""} aria-label="${escapeHtml(formatMonth(month.month))}">
        <span class="emba-timeline-title">
          <span>${escapeHtml(monthName)}</span>
          <span>${escapeHtml(year)}</span>
        </span>
      </button>
    `;
  }).join("");
  timeline.style.setProperty("--month-count", months.length);
  renderMonthDetail(selectedMonth());
}

function materialsForSection(month, section = "materials") {
  const materials = asArray(month?.materials);
  if (section === "preparation") return materials.filter((item) => PREPARATION_MATERIAL_TYPES.has(item.type));
  if (section === "vocabulary") return materials.filter((item) => item.type === "vocabulary");
  return materials.filter((item) => !PREPARATION_MATERIAL_TYPES.has(item.type) && item.type !== "vocabulary");
}

function renderMaterials(month, section = "materials") {
  const materials = isEditMode() ? asArray(month?.materials) : materialsForSection(month, section);
  if (!isEditMode()) {
    if (state.materialReader?.file) return renderMaterialReader();
    return materials.length ? `
      <ul class="emba-read-list emba-material-read-list">
        ${materials.map((item) => `
          <li class="emba-material-read-item">
            ${isReadableMaterial(item.file) ? `<button class="emba-material-open" type="button" data-material-open="${escapeHtml(item.file)}" data-material-title="${escapeHtml(item.title || "Material")}" data-material-notes="${escapeHtml(item.notes || "")}">` : `<div class="emba-read-copy">`}
              <div class="emba-read-copy">
              <span class="emba-read-title">${escapeHtml(item.title || "Material")}</span>
              ${item.notes ? `<span class="emba-read-note">${escapeHtml(item.notes)}</span>` : ""}
              </div>
              ${isReadableMaterial(item.file) ? `<span class="emba-read-action">阅读介绍 →</span>` : ""}
            ${isReadableMaterial(item.file) ? `</button>` : `</div>`}
            ${item.file && !isReadableMaterial(item.file) ? `<a class="emba-file-link" href="${escapeHtml(item.file)}" target="_blank" rel="noopener noreferrer">${externalMaterialLabel(item.file)}</a>` : ""}
          </li>
        `).join("")}
      </ul>
    ` : `<p class="emba-empty-copy">No material yet.</p>`;
  }

  return `
    <form class="emba-edit-form emba-material-form" data-material-add>
      <label class="emba-upload-target">
        <input name="file" type="file" accept=".pdf,.doc,.docx,.ppt,.pptx,.key,.pages,.numbers,.xls,.xlsx,image/*,application/pdf" />
        <span>Upload file</span>
      </label>
      <input class="emba-edit-input" name="title" placeholder="Material title" autocomplete="off" />
      <input class="emba-edit-input" name="notes" placeholder="Notes or link" autocomplete="off" />
      <button class="emba-small-btn" type="submit">Add</button>
    </form>
    ${materials.length ? `
      <ul class="emba-edit-list">
        ${materials.map((item, index) => `
          <li class="emba-edit-item">
            <input class="emba-edit-input" value="${escapeHtml(item.title)}" data-material-field="title" data-index="${index}" aria-label="Material title" />
            <input class="emba-edit-input" value="${escapeHtml(item.notes || "")}" data-material-field="notes" data-index="${index}" aria-label="Material notes" />
            ${item.file ? `<a class="emba-file-link" href="${escapeHtml(item.file)}" target="_blank" rel="noopener noreferrer">${externalMaterialLabel(item.file)}</a>` : `<span class="emba-file-spacer" aria-hidden="true"></span>`}
            <button class="emba-text-btn" type="button" data-material-delete="${index}">Delete</button>
          </li>
        `).join("")}
      </ul>
    ` : `<p class="emba-empty-copy">No material yet.</p>`}
  `;
}

function renderPreparation(month) {
  if (isEditMode()) return `<p class="emba-empty-copy">课前准备的资料分类会在阅读模式中显示；编辑模式下请在“资料”中管理文件。</p>`;
  return renderMaterials(month, "preparation");
}

function renderVocabulary(month) {
  return renderMaterials(month, "vocabulary");
}

function isReadableMaterial(file = "") {
  return /^\/emba\/materials\/.*\.md$/i.test(String(file || ""));
}

function isWebLearningPage(file = "") {
  return /^\/emba\/[^?#]+\.html(?:[?#].*)?$/i.test(String(file || ""));
}

function externalMaterialLabel(file = "") {
  return isWebLearningPage(file) ? "进入学习页 →" : "Open file";
}

function renderMaterialReader() {
  const reader = state.materialReader;
  if (!reader) return "";
  const canCopy = !reader.loading && !reader.error && Boolean(reader.markdown);
  const body = reader.loading
    ? `<p class="emba-empty-copy">正在打开课程介绍…</p>`
    : reader.error
      ? `<p class="emba-empty-copy">无法打开这份介绍：${escapeHtml(reader.error)}</p>`
      : `<div class="emba-markdown-rendered">${markdownToHtml(reader.markdown || "", reader.file)}</div>`;
  return `
    <article class="emba-material-reader">
      <div class="emba-material-reader-head">
        <div>
          <span class="emba-month-kicker">课程介绍</span>
          <h3>${escapeHtml(reader.title || "Material")}</h3>
          ${reader.notes ? `<p>${escapeHtml(reader.notes)}</p>` : ""}
        </div>
        <div class="emba-material-reader-actions">
          ${canCopy ? `<button class="emba-file-link emba-material-copy" type="button" data-material-copy>一键复制给 GPT</button>` : ""}
          <button class="emba-file-link" type="button" data-material-back>← 返回资料</button>
          <span class="emba-material-copy-status" data-material-copy-status role="status" aria-live="polite"></span>
        </div>
      </div>
      ${body}
    </article>
  `;
}

async function openMaterialReader(file, title = "Material", notes = "") {
  if (!isReadableMaterial(file)) return;
  state.materialReader = { file, title, notes, markdown: "", loading: true, error: "" };
  renderMonthDetail(selectedMonth());
  scrollToMonthTarget("[data-block-panel]");
  try {
    const response = await fetch(file, { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const markdown = await response.text();
    if (state.materialReader?.file !== file) return;
    state.materialReader = { file, title, notes, markdown, loading: false, error: "" };
  } catch (error) {
    if (state.materialReader?.file !== file) return;
    state.materialReader = { file, title, notes, markdown: "", loading: false, error: error?.message || "Unknown error" };
  }
  renderMonthDetail(selectedMonth());
  scrollToMonthTarget("[data-block-panel]");
}

function renderReflection(month) {
  const reflection = typeof month?.reflection === "string"
    ? month.reflection
    : asArray(month?.reflection).map((item) => item.body || item.title || item).filter(Boolean).join("\n\n");
  const thinkingItems = normalizeThinkingQuestions(month?.thinkingQuestions);
  if (thinkingItems.length) {
    return `
      <div class="emba-reflection-workspace" data-reflection-workspace>
        <section class="emba-reflection-section" data-reflection-section="thinking" aria-label="个人反思">
          <div class="emba-reflection-section-head">
            <h3>个人反思</h3>
            <span>${thinkingItems.length} 条 · 原文、当时上下文、寓言、Codex 补齐</span>
          </div>
          ${renderThinkingQuestions(month)}
        </section>
      </div>
    `;
  }

  const reflectionContent = isEditMode()
    ? `<textarea class="emba-reflection-editor" data-reflection-editor placeholder="Write reflection for this month...">${escapeHtml(reflection)}</textarea>`
    : reflection.trim()
      ? `<div class="emba-reflection-read">${escapeHtml(reflection)}</div>`
      : `<p class="emba-empty-copy">No reflection yet.</p>`;
  return `
    <div class="emba-reflection-workspace" data-reflection-workspace>
      <section class="emba-reflection-section" data-reflection-section="summary" aria-label="综合反思">
        <div class="emba-reflection-section-head">
          <h3>本月综合反思</h3>
        </div>
        ${reflectionContent}
      </section>
    </div>
  `;
}

function thinkingConfidenceLabel(value = "") {
  if (value === "high") return "原文清晰";
  if (value === "medium") return "语义可辨";
  if (value === "unclear") return "待核原图";
  return "";
}

function textWithBreaks(value = "") {
  return escapeHtml(String(value || "")).replace(/\r?\n/g, "<br>");
}

function renderThinkingReviewRow(label, value, className = "") {
  if (!hasTextContent(value)) return "";
  return `
    <div class="emba-thinking-review-row${className ? ` ${className}` : ""}">
      <dt>${escapeHtml(label)}</dt>
      <dd>${textWithBreaks(value)}</dd>
    </div>
  `;
}

function renderStructuredThinkingItem(item, index) {
  const itemId = item.id || `T${String(index + 1).padStart(2, "0")}`;
  const confidence = thinkingConfidenceLabel(item.confidence);
  const meta = [item.kind, item.date, confidence].filter(Boolean).join(" · ");
  const sourceMeta = [item.date, item.source, item.position].filter(Boolean).join(" · ");
  return `
    <details class="emba-thinking-review-card" data-thinking-item="${escapeHtml(itemId)}">
      <summary class="emba-thinking-review-summary">
        <span class="emba-thinking-review-id">${escapeHtml(itemId)}</span>
        <span class="emba-thinking-review-heading">
          <span class="emba-thinking-review-title">${escapeHtml(item.title)}</span>
          ${meta ? `<span class="emba-thinking-review-meta">${escapeHtml(meta)}</span>` : ""}
        </span>
      </summary>
      <div class="emba-thinking-review-body">
        <div class="emba-thinking-evidence">
          <span class="emba-thinking-label">原文</span>
          <blockquote>${textWithBreaks(item.original || item.title)}</blockquote>
          ${sourceMeta || item.image ? `
            <div class="emba-thinking-source">
              ${sourceMeta ? `<span>${escapeHtml(sourceMeta)}</span>` : ""}
              ${item.image ? `<a href="${escapeHtml(item.image)}" target="_blank" rel="noopener noreferrer">查看原图</a>` : ""}
            </div>
          ` : ""}
        </div>
        <dl class="emba-thinking-review-details">
          ${renderThinkingReviewRow("当时上下文", item.context)}
          ${renderThinkingReviewRow("寓言", item.fable, "is-fable")}
          ${renderThinkingReviewRow("Codex 补齐", item.reconstruction, "is-reconstruction")}
        </dl>
      </div>
    </details>
  `;
}

function renderThinkingQuestions(month) {
  const items = normalizeThinkingQuestions(month?.thinkingQuestions);
  const hasStructuredItems = items.some((item) => typeof item === "object");
  if (hasStructuredItems) {
    return `
      <div class="emba-thinking-review-list">
        ${items.map((item, index) => typeof item === "object"
          ? renderStructuredThinkingItem(item, index)
          : `<div class="emba-thinking-legacy-item">${escapeHtml(item)}</div>`).join("")}
      </div>
    `;
  }

  if (!isEditMode()) {
    return items.length
      ? `
        <ol class="emba-thinking-list">
          ${items.map((item) => `<li>${escapeHtml(thinkingItemText(item))}</li>`).join("")}
        </ol>
      `
      : `<p class="emba-empty-copy">No thoughts or questions yet.</p>`;
  }

  return `
    <textarea class="emba-thinking-editor" data-thinking-editor placeholder="One thought or question per line...">${escapeHtml(items.map(thinkingItemText).join("\n"))}</textarea>
  `;
}

function timelineMarkdownToDisplayMarkdown(markdown = "") {
  const source = normalizeMarkdown(markdown).trim();
  if (!source) return "";
  if (/^#{1,6}\s+/m.test(source)) return source;
  let titleSeen = false;
  return source.split(/\r?\n/).map((line) => {
    const trimmed = line.trim();
    if (!trimmed) return "";
    if (!titleSeen) {
      titleSeen = true;
      return `# ${trimmed}`;
    }
    if (/^IMG_\d{4}｜/.test(trimmed)) return `## ${trimmed}`;
    if (/^\[[^\]]+\]\s+/.test(trimmed)) return `### ${trimmed}`;
    return line;
  }).join("\n");
}

function markdownSectionCount(markdown = "") {
  const headings = normalizeMarkdown(markdown).match(/^#{1,6}\s+/gm);
  if (headings?.length) return headings.length;
  const imageSections = normalizeMarkdown(markdown).match(/^IMG_\d{4}｜/gm);
  return imageSections?.length || 1;
}

function noteStatsText(markdown = "") {
  const chars = compactTextLength(markdown);
  const sections = markdownSectionCount(markdown);
  return `${sections} section${sections === 1 ? "" : "s"} · ${chars.toLocaleString("en")} chars`;
}

function noteSourceLinks(month) {
  return asArray(month?.materials)
    .map(normalizeMaterial)
    .filter((item) => item.file && (item.file.endsWith(".md") || /note|analysis|index/i.test(`${item.type} ${item.title}`)))
    .slice(0, 4);
}

function sourceLinkLabel(item, index) {
  const title = normalize(item.title);
  if (title.includes("monthly") || title.includes("index")) return "Open index";
  if (title.includes("analysis")) return "Open analysis";
  if (title.includes("note")) return "Open notes";
  return index === 0 ? "Open source" : `Open source ${index + 1}`;
}

function renderMarkdown(month) {
  const markdown = normalizeMarkdown(month?.markdown || month?.md || month?.searchNotes);
  if (!isEditMode()) {
    const displayMarkdown = timelineMarkdownToDisplayMarkdown(markdown);
    const sources = noteSourceLinks(month);
    return displayMarkdown.trim()
      ? `
        <div class="emba-note-reader">
          <div class="emba-note-reader-head">
            <div>
              <span class="emba-note-reader-kicker">Structured note</span>
              <span class="emba-note-reader-meta">${escapeHtml(noteStatsText(displayMarkdown))}</span>
            </div>
            ${sources.length ? `
              <div class="emba-note-source-actions">
                ${sources.map((item, index) => `<a class="emba-file-link" href="${escapeHtml(item.file)}" target="_blank" rel="noopener noreferrer">${escapeHtml(sourceLinkLabel(item, index))}</a>`).join("")}
              </div>
            ` : ""}
          </div>
          <div class="emba-markdown-read emba-markdown-rendered">${markdownToHtml(displayMarkdown)}</div>
        </div>
      `
      : `<p class="emba-empty-copy">No class notes yet.</p>`;
  }

  return `
    <textarea class="emba-markdown-editor" data-markdown-editor placeholder="Write class notes for this month...">${escapeHtml(markdown)}</textarea>
  `;
}

function memoryInitials(monthKey) {
  const date = parseMonth(monthKey);
  if (!date) return "EMBA";
  return date.toLocaleDateString("en", { timeZone: "UTC", month: "short" }).toUpperCase();
}

function renderMemoryMoment(month) {
  const memories = asArray(month?.memoryMoment)
    .map((item, index) => ({ ...normalizeMemory(item, month?.month), originalIndex: index }))
    .filter((item) => item.image);
  return `
    <div class="emba-memory-gallery">
      ${isEditMode() ? `
        <label class="emba-photo-upload">
          <input name="image" type="file" accept="image/*" multiple />
          <span class="emba-photo-placeholder"><span class="emba-photo-initial">${escapeHtml(memoryInitials(month?.month))}</span><span>Upload photos</span></span>
        </label>
      ` : ""}
      ${memories.length ? `
        <div class="emba-photo-grid">
          ${memories.map((item) => `
            <article class="emba-photo-card has-photo">
              <button class="emba-photo-preview" type="button" data-memory-preview="${item.originalIndex}" aria-label="Open photo preview">
                <img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.title || formatMonth(month?.month))}" loading="lazy" />
              </button>
              ${isEditMode() ? `<button class="emba-photo-remove" type="button" data-memory-delete="${item.originalIndex}" aria-label="Remove photo">×</button>` : ""}
            </article>
          `).join("")}
        </div>
      ` : `<p class="emba-empty-copy">No memory photos yet.</p>`}
    </div>
  `;
}

function blockSummary(id, month) {
  if (id === "memory") {
    const count = asArray(month?.memoryMoment).filter((item) => normalizeMemory(item, month?.month).image).length;
    return count ? `${count} photo${count === 1 ? "" : "s"}` : "No photos yet";
  }
  if (id === "reflection") {
    const thinkingCount = normalizeThinkingQuestions(month?.thinkingQuestions).length;
    if (thinkingCount) return `${thinkingCount} 条个人反思`;
    return hasTextContent(month?.reflection) ? "综合反思" : "暂无个人思考";
  }
  if (id === "markdown") {
    return hasTextContent(month?.markdown) ? "Notes saved" : "No class notes yet";
  }
  if (id === "material") {
    const count = materialsForSection(month, "materials").filter(materialHasContent).length;
    return count ? `${count} material${count === 1 ? "" : "s"}` : "No materials yet";
  }
  if (id === "preparation") {
    const count = materialsForSection(month, "preparation").filter(materialHasContent).length;
    return count ? `${count} 个学习入口` : "暂无课前准备";
  }
  if (id === "vocabulary") {
    const count = materialsForSection(month, "vocabulary").filter(materialHasContent).length;
    return count ? "30 个术语 · IPA 音标" : "暂无专业词汇";
  }
  return "";
}

function renderBlockContent(id, month) {
  if (id === "memory") return renderMemoryMoment(month);
  if (id === "reflection") return renderReflection(month);
  if (id === "markdown") return renderMarkdown(month);
  if (id === "material") return renderMaterials(month);
  if (id === "preparation") return renderPreparation(month);
  if (id === "vocabulary") return renderVocabulary(month);
  return "";
}

function blockTemplate(id, title, month) {
  const isOpen = state.openBlockId === id;
  const summary = blockSummary(id, month);
  return `
    <article class="emba-content-block${isOpen ? " open" : ""}" data-block-id="${escapeHtml(id)}" data-block-card="${escapeHtml(id)}">
      <button class="emba-block-toggle" type="button" aria-expanded="${isOpen}" data-block-toggle="${escapeHtml(id)}">
        <span class="emba-block-title">${escapeHtml(title)}</span>
        <span class="emba-block-meta">${escapeHtml(summary)}</span>
      </button>
    </article>
  `;
}

function renderOpenBlockPanel(month) {
  if (!state.openBlockId) return "";
  const content = renderBlockContent(state.openBlockId, month);
  if (!content) return "";
  return `
    <article class="emba-block-panel" data-block-panel="${escapeHtml(state.openBlockId)}">
      <div class="emba-block-panel-nav">
        <button class="emba-panel-back" type="button" data-block-close>← 返回课程入口</button>
      </div>
      <div class="emba-block-body">${content}</div>
    </article>
  `;
}

function scrollToMonthTarget(selector) {
  requestAnimationFrame(() => {
    document.querySelector(selector)?.scrollIntoView({ behavior: "smooth", block: "start" });
  });
}

function renderMonthDetail(month) {
  const detail = $("#embaMonthDetail");
  if (!detail) return;
  detail.dataset.mode = isEditMode() ? "edit" : "read";
  if (!month) {
    detail.innerHTML = "";
    return;
  }
  detail.innerHTML = `
    <div class="emba-month-kicker">${escapeHtml(formatMonth(month.month))}</div>
    ${renderOpenBlockPanel(month)}
    <div class="emba-block-grid">
      ${materialsForSection(month, "preparation").some(materialHasContent) ? blockTemplate("preparation", "课前准备", month) : ""}
      ${materialsForSection(month, "vocabulary").some(materialHasContent) ? blockTemplate("vocabulary", "专业词汇", month) : ""}
      ${blockTemplate("reflection", "Reflection（我的思考）", month)}
      ${blockTemplate("memory", "照片", month)}
      ${blockTemplate("material", "资料", month)}
      ${blockTemplate("markdown", "课堂笔记（完全内容整合版）", month)}
    </div>
  `;
}

function setActiveMonth(monthIdValue) {
  if (!monthIdValue || state.selectedMonthId === monthIdValue) return;
  state.selectedMonthId = monthIdValue;
  state.openBlockId = "";
  state.materialReader = null;
  document.querySelectorAll("[data-month-id]").forEach((button) => {
    const isActive = button.dataset.monthId === state.selectedMonthId;
    button.classList.toggle("active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
    if (isActive) button.setAttribute("aria-current", "date");
    else button.removeAttribute("aria-current");
  });
  renderMonthDetail(selectedMonth());
}

function hasEmbaAccess() {
  if (state.accessGranted) return true;
  if (document.cookie.split(";").some((cookie) => cookie.trim() === "turnpo_emba_ui=granted")) return true;
  try {
    return sessionStorage.getItem(EMBA_ACCESS_KEY) === "granted";
  } catch {
    return false;
  }
}

function setEmbaAccess(granted) {
  state.accessGranted = granted;
  document.cookie = granted
    ? "turnpo_emba_ui=granted; Path=/emba; Max-Age=604800; SameSite=Lax"
    : "turnpo_emba_ui=; Path=/emba; Max-Age=0; SameSite=Lax";
  try {
    if (granted) sessionStorage.setItem(EMBA_ACCESS_KEY, "granted");
    else sessionStorage.removeItem(EMBA_ACCESS_KEY);
  } catch {
    // Keep the live page state even if sessionStorage is unavailable.
  }
}

function renderAccessState() {
  const granted = hasEmbaAccess();
  const gate = $("#embaAccessGate");
  const app = $("#embaApp");
  const lock = $("#embaLock");
  if (!granted) state.editMode = false;
  if (gate) gate.hidden = granted;
  if (app) app.hidden = !granted;
  if (lock) lock.hidden = !granted;
  updateEditModeControl();
  if (granted && !state.libraryLoaded) loadLibrary();
  if (granted && !state.knowledge.loaded) loadKnowledgeBase();
}

async function loadLibrary() {
  try {
    state.libraryLoaded = true;
    const response = await fetch("/emba/materials.json", { cache: "no-store" });
    if (!response.ok) throw new Error(`Could not load materials.json (${response.status})`);
    const library = await response.json();
    const baseLibrary = normalizeLibraryData(library);
    const cloudLibrary = await loadCloudLibrary();
    const localLibrary = savedLibrary();
    if (cloudLibrary) {
      state.library = mergeLibrary(baseLibrary, cloudLibrary);
      if (!cloudLibrary.months.length && localLibrary) {
        state.library = mergeLibrary(state.library, localLibrary);
        saveLibrary();
      } else {
        persistLocalLibrary();
      }
    } else {
      state.library = mergeLibrary(baseLibrary, localLibrary);
    }
    state.selectedMonthId = timelineMonths()[0] ? monthId(timelineMonths()[0]) : "";
    renderTimeline();
    if (state.knowledge.notes.length) renderKnowledgeBase();
  } catch (error) {
    state.libraryLoaded = false;
    const timeline = $("#embaTimeline");
    if (timeline) timeline.innerHTML = `<div class="emba-empty-state">${escapeHtml(error.message)}</div>`;
  }
}

async function loadCloudLibrary() {
  try {
    const response = await fetch(EMBA_LIBRARY_API, {
      cache: "no-store",
      credentials: "same-origin"
    });
    if (response.status === 401 || response.status === 404) {
      state.cloudReady = false;
      setSyncStatus("Local only", "warn");
      return null;
    }
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || payload.configured === false) {
      state.cloudReady = false;
      setSyncStatus("Local only", "warn");
      return null;
    }
    state.cloudReady = true;
    setSyncStatus(payload.months?.length ? "Cloud synced" : "Cloud ready");
    return normalizeLibraryData(payload);
  } catch (error) {
    state.cloudReady = false;
    setSyncStatus("Local only", "warn");
    return null;
  }
}

function initAccessGate() {
  $("#embaAccessForm")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const passwordInput = $("#embaPassword");
    const note = $("#embaAccessNote");
    if ((passwordInput?.value || "").trim() === EMBA_PASSWORD) {
      setEmbaAccess(true);
      if (passwordInput) passwordInput.value = "";
      if (note) note.textContent = "";
      renderAccessState();
      return;
    }
    if (note) note.textContent = "Password is incorrect.";
    passwordInput?.focus();
  });

  $("#embaLock")?.addEventListener("click", async () => {
    setEmbaAccess(false);
    setEditMode(false);
    await fetch("/emba/logout", { method: "POST" }).catch(() => null);
    renderAccessState();
    $("#embaPassword")?.focus();
  });

  $("#embaEditToggle")?.addEventListener("click", () => {
    if (!hasEmbaAccess()) return;
    setEditMode(!isEditMode());
  });

  renderAccessState();
}

$("#embaTimeline")?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-month-id]");
  if (!button) return;
  setActiveMonth(button.dataset.monthId || "");
});

$("#embaMonthDetail")?.addEventListener("click", async (event) => {
  const blockClose = event.target.closest("[data-block-close]");
  if (blockClose) {
    state.openBlockId = "";
    state.materialReader = null;
    renderMonthDetail(selectedMonth());
    scrollToMonthTarget("#embaMonthDetail");
    return;
  }

  const materialCopy = event.target.closest("[data-material-copy]");
  if (materialCopy) {
    event.preventDefault();
    const status = $("[data-material-copy-status]");
    const originalLabel = materialCopy.textContent;
    const copied = await copyPlainText(state.materialReader?.markdown || "");
    materialCopy.textContent = copied ? "已复制" : "复制失败";
    if (status) status.textContent = copied ? "完整 Markdown 已复制，可直接粘贴给 GPT。" : "请选中文档内容手动复制。";
    window.setTimeout(() => {
      if (!materialCopy.isConnected) return;
      materialCopy.textContent = originalLabel;
      if (status) status.textContent = "";
    }, 2400);
    return;
  }

  const materialBack = event.target.closest("[data-material-back]");
  if (materialBack) {
    state.materialReader = null;
    renderMonthDetail(selectedMonth());
    scrollToMonthTarget("[data-block-panel]");
    return;
  }

  const materialOpen = event.target.closest("[data-material-open]");
  if (materialOpen) {
    event.preventDefault();
    openMaterialReader(
      materialOpen.dataset.materialOpen || "",
      materialOpen.dataset.materialTitle || materialOpen.textContent?.trim() || "Material",
      materialOpen.dataset.materialNotes || ""
    );
    return;
  }

  const memoryDelete = event.target.closest("[data-memory-delete]");
  if (memoryDelete) {
    if (!isEditMode()) return;
    const month = editableMonth();
    month.memoryMoment.splice(Number(memoryDelete.dataset.memoryDelete), 1);
    bumpRevision(month, "memoryRevision");
    saveLibrary();
    renderMonthDetail(selectedMonth());
    return;
  }

  const materialDelete = event.target.closest("[data-material-delete]");
  if (materialDelete) {
    if (!isEditMode()) return;
    const month = editableMonth();
    month.materials.splice(Number(materialDelete.dataset.materialDelete), 1);
    bumpRevision(month, "materialsRevision");
    saveLibrary();
    renderMonthDetail(selectedMonth());
    return;
  }

  const memoryPreview = event.target.closest("[data-memory-preview]");
  if (memoryPreview) {
    const month = selectedMonth();
    const item = normalizeMemory(asArray(month?.memoryMoment)[Number(memoryPreview.dataset.memoryPreview)], month?.month);
    if (item?.image) openMemoryLightbox(item.image, item.title || formatMonth(month?.month));
    return;
  }

  const button = event.target.closest("[data-block-toggle]");
  if (!button) return;
  const blockId = button.dataset.blockToggle || "";
  state.openBlockId = blockId;
  state.materialReader = null;
  renderMonthDetail(selectedMonth());
  scrollToMonthTarget("[data-block-panel]");
});

$("#embaMonthDetail")?.addEventListener("change", async (event) => {
  const target = event.target;
  if (!target.matches('.emba-photo-upload input[name="image"]')) return;
  if (!isEditMode()) {
    target.value = "";
    return;
  }
  const files = [...(target.files || [])].filter((file) => file.type.startsWith("image/"));
  if (!files.length) return;
  const month = editableMonth();
  let photosAdded = 0;
  for (const file of files) {
    const uploaded = await uploadEmbaFile(file, month.month, "memory");
    const image = uploaded?.url || await imageFileToDataUrl(file);
    if (!image) continue;
    month.memoryMoment.push({
      title: "Memory",
      image,
      caption: "",
      month: month.month
    });
    photosAdded += 1;
  }
  if (photosAdded) bumpRevision(month, "memoryRevision");
  saveLibrary();
  renderMonthDetail(selectedMonth());
});

$("#embaMonthDetail")?.addEventListener("input", (event) => {
  const target = event.target;
  if (!isEditMode()) return;

  if (target.matches("[data-reflection-editor]")) {
    const month = editableMonth();
    month.reflection = target.value;
    bumpInputRevision(target, month, "reflectionRevision");
    saveLibrary();
    return;
  }

  if (target.matches("[data-thinking-editor]")) {
    const month = editableMonth();
    month.thinkingQuestions = target.value.split(/\r?\n/).map((item) => item.trim()).filter(Boolean);
    bumpInputRevision(target, month, "reflectionRevision");
    saveLibrary();
    return;
  }

  if (target.matches("[data-markdown-editor]")) {
    const month = editableMonth();
    month.markdown = target.value;
    bumpInputRevision(target, month, "markdownRevision");
    saveLibrary();
    return;
  }

  if (target.matches("[data-material-field]")) {
    const month = editableMonth();
    const item = month.materials[Number(target.dataset.index)];
    if (!item) return;
    item[target.dataset.materialField] = target.value;
    bumpInputRevision(target, month, "materialsRevision");
    saveLibrary();
  }
});

$("#embaMonthDetail")?.addEventListener("submit", async (event) => {
  const form = event.target;
  if (!form.matches("[data-material-add]")) return;
  event.preventDefault();
  if (!isEditMode()) return;
  const month = editableMonth();

  if (form.matches("[data-material-add]")) {
    const file = form.elements.file?.files?.[0] || null;
    const title = String(form.elements.title?.value || "").trim();
    const notes = String(form.elements.notes?.value || "").trim();
    const uploaded = file ? await uploadEmbaFile(file, month.month, "material") : null;
    if (file && !uploaded && !title && !notes) return;
    if (!file && !title && !notes) return;
    month.materials.push({
      title: title || uploaded?.name || "Material",
      type: uploaded?.type || "",
      file: uploaded?.url || "",
      notes
    });
    bumpRevision(month, "materialsRevision");
    saveLibrary();
    form.reset();
    renderMonthDetail(selectedMonth());
  }
});

document.addEventListener("click", (event) => {
  if (!event.target.closest("[data-lightbox-close]")) return;
  closeMemoryLightbox();
});

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;
  closeMemoryLightbox();
});

function initKnowledgeInteractions() {
  $("#embaKnowledgeSearch")?.addEventListener("input", (event) => {
    state.knowledge.filters.query = event.target.value;
    renderKnowledgeResults();
  });

  $("#embaKnowledgeResults")?.addEventListener("click", (event) => {
    const monthButton = event.target.closest("[data-knowledge-month]");
    if (monthButton) {
      setActiveMonth(monthButton.dataset.knowledgeMonth || "");
      $("#embaMonthDetail")?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    const noteButton = event.target.closest("[data-knowledge-note]");
    if (!noteButton) return;
    openKnowledgeNote(noteButton.dataset.knowledgeNote || "");
  });
}

initKnowledgeInteractions();
initAccessGate();

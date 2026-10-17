// Original starter curriculum; not scraped from commercial course materials.
const groups = {
 daily: ['日常生活','DAILY LIFE',[
 ['habit','习惯','ˈhæbɪt','n.','Reading is a good habit.','阅读是个好习惯。'],
 ['practice','练习','ˈpræktɪs','n. / v.','I practice English every day.','我每天练习英语。'],
 ['improve','提高；改善','ɪmˈpruːv','v.','Small steps improve your skills.','小小的进步能提高你的技能。'],
 ['remember','记得','rɪˈmembər','v.','Remember to drink some water.','记得喝点水。'],
 ['forget','忘记','fərˈɡet','v.','Do not forget your keys.','别忘了你的钥匙。'],
 ['comfortable','舒适的','ˈkʌmftəbl','adj.','This chair is comfortable.','这把椅子很舒适。'],
 ['healthy','健康的','ˈhelθi','adj.','A healthy breakfast gives me energy.','健康的早餐给我能量。'],
 ['prepare','准备','prɪˈper','v.','Let us prepare dinner together.','我们一起准备晚餐吧。'],
 ['usually','通常','ˈjuːʒuəli','adv.','I usually walk to the park.','我通常步行去公园。'],
 ['sometimes','有时','ˈsʌmtaɪmz','adv.','We sometimes cook together.','我们有时一起做饭。'],
 ['quiet','安静的','ˈkwaɪət','adj.','The library is quiet.','图书馆很安静。'],
 ['enough','足够的','ɪˈnʌf','adj. / adv.','We have enough time.','我们有足够的时间。'],
 ['choose','选择','tʃuːz','v.','Choose a book you like.','选一本你喜欢的书。'],
 ['share','分享','ʃer','v.','I share my ideas with friends.','我和朋友分享想法。'],
 ['fresh','新鲜的','freʃ','adj.','These apples are fresh.','这些苹果很新鲜。'],
 ['borrow','借入','ˈbɑːroʊ','v.','May I borrow your pen?','我可以借你的笔吗？'],
 ['return','归还；返回','rɪˈtɜːrn','v.','Please return the book tomorrow.','请明天归还这本书。'],
 ['neighbor','邻居','ˈneɪbər','n.','Our neighbor has a small dog.','我们的邻居有一只小狗。'],
 ['discover','发现','dɪˈskʌvər','v.','I discover something new every day.','我每天都发现一些新事物。'],
 ['relax','放松','rɪˈlæks','v.','Music helps me relax.','音乐帮助我放松。']]],
 travel: ['旅行出行','ON THE ROAD',[
 ['journey','旅程','ˈdʒɜːrni','n.','Our journey begins today.','我们的旅程今天开始。'],
 ['ticket','票','ˈtɪkɪt','n.','I need a train ticket.','我需要一张火车票。'],
 ['airport','机场','ˈerpɔːrt','n.','We arrived at the airport early.','我们很早就到了机场。'],
 ['luggage','行李','ˈlʌɡɪdʒ','n.','My luggage is light.','我的行李很轻。'],
 ['passport','护照','ˈpæspɔːrt','n.','Keep your passport safe.','保管好你的护照。'],
 ['direction','方向','dəˈrekʃn','n.','Which direction is the station?','车站在哪个方向？'],
 ['arrive','到达','əˈraɪv','v.','We arrive at six.','我们六点到达。'],
 ['depart','出发','dɪˈpɑːrt','v.','The train departs at noon.','火车中午出发。'],
 ['reserve','预订','rɪˈzɜːrv','v.','I would like to reserve a room.','我想预订一个房间。'],
 ['explore','探索','ɪkˈsplɔːr','v.','Let us explore the old town.','我们去探索古城吧。'],
 ['local','当地的','ˈloʊkl','adj.','Try some local food.','尝尝当地的食物。'],
 ['map','地图','mæp','n.','The map shows a nearby park.','地图上显示附近有一个公园。'],
 ['distance','距离','ˈdɪstəns','n.','What is the distance to the hotel?','到酒店有多远？'],
 ['entrance','入口','ˈentrəns','n.','The entrance is on the left.','入口在左边。'],
 ['exit','出口','ˈeɡzɪt','n.','The exit is near the stairs.','出口在楼梯附近。'],
 ['delay','延误','dɪˈleɪ','n. / v.','There is a short delay.','有一小段延误。'],
 ['scenery','风景','ˈsiːnəri','n.','The scenery is beautiful.','风景很美。'],
 ['adventure','冒险；奇遇','ədˈventʃər','n.','Every trip is an adventure.','每次旅行都是一次冒险。'],
 ['nearby','附近的；在附近','ˌnɪrˈbaɪ','adj. / adv.','There is a cafe nearby.','附近有一家咖啡馆。'],
 ['destination','目的地','ˌdestɪˈneɪʃn','n.','Our destination is a small village.','我们的目的地是一个小村庄。']]],
 work: ['学习职场','LEARN & WORK',[
 ['achieve','实现；达到','əˈtʃiːv','v.','You can achieve your goal.','你能实现你的目标。'],
 ['focus','专注','ˈfoʊkəs','v. / n.','Focus on one task at a time.','一次专注于一项任务。'],
 ['effort','努力','ˈefərt','n.','Your effort makes a difference.','你的努力会带来改变。'],
 ['progress','进步','ˈprɑːɡres','n.','You are making progress.','你正在取得进步。'],
 ['challenge','挑战','ˈtʃælɪndʒ','n.','This task is a new challenge.','这项任务是一个新的挑战。'],
 ['confident','自信的','ˈkɑːnfɪdənt','adj.','I feel confident about the test.','我对考试有信心。'],
 ['patient','耐心的','ˈpeɪʃnt','adj.','Be patient with yourself.','对自己多一点耐心。'],
 ['curious','好奇的','ˈkjʊriəs','adj.','Curious students ask questions.','好奇的学生会提问。'],
 ['knowledge','知识','ˈnɑːlɪdʒ','n.','Reading builds knowledge.','阅读增长知识。'],
 ['skill','技能','skɪl','n.','Writing is a useful skill.','写作是一项有用的技能。'],
 ['schedule','日程','ˈskedʒuːl','n.','Check your schedule for tomorrow.','看看你明天的日程。'],
 ['meeting','会议','ˈmiːtɪŋ','n.','The meeting starts at nine.','会议九点开始。'],
 ['project','项目','ˈprɑːdʒekt','n.','Our project is almost finished.','我们的项目快完成了。'],
 ['deadline','截止日期','ˈdedlaɪn','n.','The deadline is Friday.','截止日期是星期五。'],
 ['discuss','讨论','dɪˈskʌs','v.','Let us discuss this idea.','我们讨论一下这个想法吧。'],
 ['explain','解释','ɪkˈspleɪn','v.','Can you explain the rule?','你能解释一下这条规则吗？'],
 ['solution','解决办法','səˈluːʃn','n.','We found a simple solution.','我们找到了一个简单的解决办法。'],
 ['purpose','目的','ˈpɜːrpəs','n.','What is the purpose of this task?','这项任务的目的是什么？'],
 ['opportunity','机会','ˌɑːpərˈtuːnəti','n.','This is a good opportunity to learn.','这是一个学习的好机会。'],
 ['develop','发展；培养','dɪˈveləp','v.','Practice helps develop new skills.','练习有助于培养新技能。']]]
};
export const decks=Object.entries(groups).map(([id,[name,label,items]])=>({id,name,label,count:items.length}));
export const words=Object.entries(groups).flatMap(([deck,[,,items]])=>items.map(([word,meaning,ipa,pos,example,translation])=>({id:word,word,meaning,ipa,pos,example,translation,deck})));
export const lessons=[
 {id:'present',title:'一般现在时',en:'The present simple',tag:'时态入门',minutes:5,intro:'说习惯，也说事实。',rule:'主语 + 动词原形；主语是 he / she / it 时，动词通常加 -s 或 -es。',notes:['习惯：常与 every day、usually、often 搭配。','否定：I / you / we / they + do not + 动词原形；he / she / it + does not + 动词原形。','疑问：Do / Does + 主语 + 动词原形？'],examples:[['I read every evening.','我每天晚上阅读。'],['She practices English every day.','她每天练习英语。'],['Does he work here?','他在这里工作吗？']],pitfall:'有了 does / does not，后面的动词要用原形：She does not like coffee。',questions:[['She ___ English every day.',['study','studies','studying','studied'],1,'主语 She 是第三人称单数，study 要变为 studies。'],['They ___ to school on Mondays.',['go','goes','going','gone'],0,'They 搭配动词原形 go。'],['He does not ___ coffee.',['likes','liked','like','liking'],2,'does not 后面用动词原形。'],['___ your brother work here?',['Do','Does','Is','Are'],1,'your brother 是单数，疑问句用 Does。'],['The sun ___ in the east.',['rise','rising','rose','rises'],3,'客观事实用一般现在时；the sun 是单数，使用 rises。']]},
 {id:'continuous',title:'现在进行时',en:'The present continuous',tag:'时态入门',minutes:5,intro:'表达此刻正在发生的事。',rule:'主语 + am / is / are + 动词 -ing。',notes:['I 用 am；he / she / it 用 is；you / we / they 用 are。','否定时在 be 动词后加 not；疑问时把 be 动词放到主语前。','常见提示：now、at the moment、Look!、Listen!。'],examples:[['I am reading now.','我现在正在阅读。'],['They are waiting for the train.','他们正在等火车。'],['Is she working?','她正在工作吗？']],pitfall:'不要漏掉 be 动词：I reading 应改为 I am reading。',questions:[['Look! The children ___ in the park.',['play','plays','are playing','played'],2,'Look! 提示正在发生的动作，children 是复数。'],['I ___ a book right now.',['am reading','read','reads','reading'],0,'I 搭配 am，后接 reading。'],['She ___ dinner at the moment.',['cook','is cooking','cooks','cooked'],1,'at the moment 提示现在进行时。'],['___ they waiting outside now?',['Do','Does','Is','Are'],3,'进行时疑问句把 are 提到主语 they 前。'],['He is not ___ now.',['sleep','sleeps','sleeping','slept'],2,'is not 后面接动词 -ing。']]},
 {id:'past',title:'一般过去时',en:'The past simple',tag:'时态进阶',minutes:6,intro:'把已经发生的事讲清楚。',rule:'肯定句用动词过去式；否定句用 did not + 动词原形。',notes:['规则动词通常加 -ed；不规则动词需要记忆，如 go → went、see → saw。','疑问句：Did + 主语 + 动词原形？','过去的 be 动词：I / he / she / it 用 was；you / we / they 用 were。'],examples:[['We visited a museum yesterday.','我们昨天参观了博物馆。'],['I went home early.','我很早就回家了。'],['Did you see the map?','你看到地图了吗？']],pitfall:'did 已经表示过去，后面的动词不要再变过去式：Did you go?。',questions:[['We ___ a museum yesterday.',['visit','visits','visited','visiting'],2,'yesterday 表示过去，visit 的过去式是 visited。'],['She ___ to the park last Sunday.',['go','went','goes','going'],1,'go 的过去式是不规则变化 went。'],['Did you ___ the meeting yesterday?',['join','joined','joins','joining'],0,'Did 后面的实义动词用原形。'],['They ___ not at home last night.',['is','was','are','were'],3,'主语 They 的过去时 be 动词是 were。'],['He did not ___ the question.',['understood','understands','understand','understanding'],2,'did not 后用动词原形 understand。']]},
 {id:'future',title:'谈论未来',en:'Will & going to',tag:'时态进阶',minutes:5,intro:'说计划、预测和临时决定。',rule:'will + 动词原形；am / is / are going to + 动词原形。',notes:['will 常用于临时决定、承诺或预测。','be going to 常用于事先的计划，或基于眼前迹象的预测。','will 的否定是 will not（won’t）；be going to 的否定在 be 后加 not。'],examples:[['I will help you.','我会帮助你。'],['We are going to travel next week.','我们计划下周去旅行。'],['Look at the clouds. It is going to rain.','看那些云，要下雨了。']],pitfall:'will 后直接用动词原形，不要写成 will to go 或 will goes。',questions:[['I will ___ you tomorrow.',['call','called','calls','calling'],0,'will 后用动词原形 call。'],['We ___ going to travel next week.',['am','is','are','be'],2,'主语 We 搭配 are。'],['She is going to ___ a new skill.',['learns','learned','learning','learn'],3,'going to 后接动词原形。'],['He ___ not come tomorrow.',['does','will','is','did'],1,'will not 表示未来不会发生的事。'],['I ___ going to study tonight.',['am','is','are','do'],0,'I 搭配 am going to。']]},
 {id:'articles',title:'冠词 a、an 与 the',en:'Articles',tag:'句子基础',minutes:6,intro:'从“一个”到“那个”。',rule:'首次提到一个可数名词通常用 a / an；双方知道是哪一个时用 the。',notes:['a / an 的选择看读音：辅音音素前用 a，元音音素前用 an。','a / an 只搭配单数可数名词，如 a book、an apple。','唯一的事物常用 the，如 the sun。泛指不可数名词或复数名词通常不用冠词。'],examples:[['I have a book. The book is new.','我有一本书。这本书是新的。'],['She is an honest person.','她是一个诚实的人。'],['He studies at a university.','他在一所大学学习。']],pitfall:'看声音，不只看字母：an hour（h 不发音），a university（开头是 /j/）。',questions:[['I ate ___ apple for breakfast.',['a','an','the','不填'],1,'apple 以元音音素开头，首次提到用 an。'],['It takes ___ hour to get there.',['a','the','an','不填'],2,'hour 的 h 不发音，以元音音素开头。'],['___ sun is bright today.',['A','An','不填','The'],3,'太阳是唯一的事物，通常用 the。'],['He is ___ university student.',['a','an','不填','any'],0,'university 开头为 /j/，是辅音音素，用 a。'],['I have a dog. ___ dog is very friendly.',['A','An','The','不填'],2,'再次提到同一只狗，用 the。']]},
 {id:'prepositions',title:'时间介词 in、on、at',en:'Prepositions of time',tag:'句子基础',minutes:5,intro:'准确说出“什么时候”。',rule:'in 用于月份、年份等较长时段；on 用于具体日期；at 用于时刻。',notes:['in May、in 2026、in the morning。','on Monday、on Friday morning、on October 2。','at nine、at noon、at night。last / next / this / every 前通常不加时间介词。'],examples:[['The meeting starts at nine.','会议九点开始。'],['We travel in July.','我们七月旅行。'],['I practice on Monday mornings.','我在星期一早晨练习。']],pitfall:'具体某天的早晨用 on：on Monday morning；泛指早晨用 in the morning。',questions:[['The train leaves ___ 8:30.',['in','on','at','for'],2,'具体时刻前用 at。'],['My birthday is ___ May.',['in','on','at','to'],0,'月份前用 in。'],['We have a meeting ___ Monday.',['in','at','for','on'],3,'星期几前用 on。'],['I read ___ the morning.',['on','in','at','to'],1,'泛指早晨用 in the morning。'],['They arrived ___ Friday evening.',['in','at','on','for'],2,'具体某天的晚上用 on。']]},
 {id:'comparison',title:'比较级与最高级',en:'Comparatives & superlatives',tag:'表达升级',minutes:6,intro:'比较两样事物，选出最特别的一个。',rule:'较短形容词通常加 -er / -est；较长形容词通常用 more / most。',notes:['比较级常接 than：smaller than、more useful than。','最高级通常带 the：the smallest、the most useful。','不规则变化：good → better → best；bad → worse → worst。'],examples:[['This bag is lighter than mine.','这个包比我的轻。'],['This is the most useful lesson.','这是最有用的一课。'],['Today is better than yesterday.','今天比昨天更好。']],pitfall:'不要重复标记比较级：more easier 应改为 easier。',questions:[['This room is ___ than that one.',['small','smaller','smallest','most small'],1,'than 提示比较级，small 变为 smaller。'],['It is the ___ book on the shelf.',['interesting','more interesting','most interesting','interest'],2,'the 和比较范围提示最高级，长形容词用 most。'],['My English is ___ than before.',['good','best','well','better'],3,'good 的比较级为 better。'],['She is the ___ student in the class.',['tallest','taller','tall','more tall'],0,'班级中最高，用最高级 tallest。'],['This exercise is ___ than the last one.',['more easy','easier','easiest','most easy'],1,'easy 变为 easier，不需要再加 more。']]},
 {id:'modals',title:'情态动词 can、should、must',en:'Modal verbs',tag:'表达升级',minutes:5,intro:'说能力、建议和必要性。',rule:'can / should / must + 动词原形；不随主语变化。',notes:['can 表示能力或许可：I can swim。','should 表示建议：You should rest。','must 表示必须；must not 表示禁止。don’t have to 表示不必。'],examples:[['She can speak English.','她会说英语。'],['You should drink some water.','你应该喝点水。'],['You must not park here.','你不能在这里停车。']],pitfall:'must not 是“不准”，不是“不必”；表示“不必”要用 don’t have to。',questions:[['She can ___ English.',['speaks','spoke','speak','speaking'],2,'can 后面接动词原形。'],['You ___ rest if you feel tired.',['should','are','has','does'],0,'提出建议时使用 should。'],['You must not ___ here.',['parks','parked','parking','park'],3,'must not 后接动词原形。'],['“You do not have to come.” 的意思是？',['你不准来','你不必来','你必须来','你已经来了'],1,'do not have to 表示没有必要，不是禁止。'],['He ___ swim very well.',['cans','can','is can','can to'],1,'can 不随主语变形，后直接接 swim。']]}
];
export const grammarQuestions=lessons.flatMap(l=>l.questions.map(([prompt,options,answer,explanation],i)=>({id:`${l.id}-${i}`,kind:'grammar',lesson:l.id,prompt,options,answer,explanation})));
// Stable, varied answer positions for the built-in vocabulary exercises.
export const wordQuestions=words.map((w,i)=>{const others=words.filter(x=>x.id!==w.id);const distractors=[others[(i*7)%others.length].meaning,others[(i*7+17)%others.length].meaning,others[(i*7+34)%others.length].meaning];const answer=i%4;distractors.splice(answer,0,w.meaning);return{id:`word-${w.id}`,kind:'word',word:w.id,prompt:`“${w.word}” 的意思是？`,options:distractors,answer,explanation:`${w.word}：${w.meaning}。例句：${w.example}（${w.translation}）`};});
export const questions=[...grammarQuestions,...wordQuestions];

// 効果音の準備
const SOUNDS = {
  bell: new Audio('assets/sounds/bell.mp3'),
  chalk: new Audio('assets/sounds/chalk.mp3'),
  flip: new Audio('assets/sounds/flip.mp3')
};

// 質問プール（全12問からランダム10問抽出）
const questionPool = [
  {
    q: '放課後、いちばん心が躍るのは？',
    choices: [
      { text: '先輩の特進講座を見学', scores: { course: '特進', club: null, vibe: 2 } },
      { text: '英語カフェでフリートーク', scores: { course: '英語', club: null, vibe: 2 } },
      { text: '音楽室で即興演奏', scores: { course: '音楽', club: null, vibe: 3 } },
      { text: '美術室で実験的ペイント', scores: { course: '美術', club: null, vibe: 3 } }
    ]
  },
  {
    q: '偶然手に入れた秘密の鍵。何を開ける？',
    choices: [
      { text: '先端研究室の扉', scores: { course: '特進', club: null, vibe: 2 } },
      { text: '外国人教師の休憩室', scores: { course: '英語', club: null, vibe: 2 } },
      { text: '音楽室の地下倉庫', scores: { course: '音楽', club: null, vibe: 4 } },
      { text: '美術室の謎のアトリエ', scores: { course: '美術', club: null, vibe: 4 } }
    ]
  },
  {
    q: '文化祭の出し物を提案するなら？',
    choices: [
      { text: '科学実験ショー', scores: { course: '特進', club: '理科研究部', vibe: 3 } },
      { text: '国際交流カフェ', scores: { course: '英語', club: '英語研究部', vibe: 2 } },
      { text: 'アカペラライブ', scores: { course: '音楽', club: '合唱部', vibe: 4 } },
      { text: '幻想的な展示会', scores: { course: '美術', club: '美術部', vibe: 4 } }
    ]
  }
  // 他の質問は同様に追加
];

// シャッフル関数
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

// スコア初期化
let tally = {
  course: { 特進: 0, 英語: 0, 音楽: 0, 美術: 0 },
  club: {},
  vibe: 0
};

// ランダムボーナス係数
const bonus = 0.8 + Math.random() * 0.4;

// 結果テンプレート
const previewTemplates = [
  '📘【${course}】優等生タイプ×${club}で放課後を制覟！',
  '🎵 リズムに乗る【${course}】×${club}、その才能開花中！',
  '🎨 【${course}】の感性に${club}の実力がプラス！',
  '💡 ${club}でアイデア爆発の【${course}】、次はあなたの番！',
  '🌟 【${course}】×${club}の最強コンボ、仲間が歓声！'
];

// 現在の質問インデックスと質問リスト
let currentQuestion = 0;
let questions = [];

// 診断を開始する関数
function startQuiz() {
  // 質問をシャッフルして10問選択
  shuffle(questionPool);
  questions = questionPool.slice(0, 10);
  
  // スコアをリセット
  tally = {
    course: { 特進: 0, 英語: 0, 音楽: 0, 美術: 0 },
    club: {},
    vibe: 0
  };
  
  // 開始画面を非表示
  document.getElementById('startContainer').style.display = 'none';
  
  // 診断画面を表示
  const quizContainer = document.getElementById('quizContainer');
  quizContainer.style.display = 'block';
  
  // プログレスバーを初期化
  updateProgress(0);
  
  // 最初の質問を表示
  displayQuestion();
}

// 質問を表示する関数
function displayQuestion() {
  const quizContainer = document.getElementById('quizContainer');
  const question = questions[currentQuestion];
  
  // ベル音を再生
  SOUNDS.bell.play();
  
  const html = `
    <div class="question-card">
      <div class="card-inner">
        <div class="card-front">
          <h2>質問 ${currentQuestion + 1}</h2>
          <p>${question.q}</p>
          <div class="choices">
            ${question.choices.map((choice, index) => `
              <button class="choice-btn" data-index="${index}">
                ${choice.text}
                <span class="chalk-dust"></span>
              </button>
            `).join('')}
          </div>
        </div>
      </div>
    </div>
  `;
  
  quizContainer.innerHTML = html;
  
  // 選択肢のクリックイベントを設定
  document.querySelectorAll('.choice-btn').forEach(button => {
    button.addEventListener('click', handleChoice);
    button.addEventListener('mouseover', () => SOUNDS.chalk.play());
  });
}

// 選択肢が選ばれたときの処理
function handleChoice(event) {
  const choiceIndex = event.target.dataset.index;
  const choice = questions[currentQuestion].choices[choiceIndex];
  
  // スコアを加算
  if (choice.scores.course) {
    tally.course[choice.scores.course] += bonus;
  }
  if (choice.scores.club) {
    tally.club[choice.scores.club] = (tally.club[choice.scores.club] || 0) + bonus;
  }
  tally.vibe += choice.scores.vibe * bonus;
  
  // カードめくりアニメーション
  const card = event.target.closest('.question-card');
  card.classList.add('flipping');
  SOUNDS.flip.play();
  
  // プログレスバーを更新
  updateProgress(currentQuestion + 1);
  
  setTimeout(() => {
    if (currentQuestion < questions.length - 1) {
      currentQuestion++;
      displayQuestion();
    } else {
      showResult();
    }
  }, 1000);
}

// プログレスバーを更新する関数
function updateProgress(current) {
  const progress = document.querySelector('.progress-bar');
  const percentage = (current / questions.length) * 100;
  progress.style.width = `${percentage}%`;
}

// 結果を表示する関数
function showResult() {
  const result = calcResult();
  const message = makePreviewMessage(result);
  
  const quizContainer = document.getElementById('quizContainer');
  quizContainer.innerHTML = `
    <div class="result-card">
      <div class="nobara-chan"></div>
      <h2>診断結果</h2>
      <h3>${message}</h3>
      <div class="result-details">
        <p><strong>あなたにおすすめの学科：</strong><br>${result.course}</p>
        <p><strong>相性のよい部活動：</strong><br>${result.club}</p>
        <p><strong>あなたの学校生活タイプ：</strong><br>${result.vibe}</p>
      </div>
      <div class="badge-collection">
        ${Object.keys(tally.club).map(club => `
          <div class="badge" title="${club}">
            <img src="assets/img/badges/${club}.png" alt="${club}">
          </div>
        `).join('')}
      </div>
      <button id="createIdBtn" class="btn-create">学生証を作成</button>
    </div>
  `;
  
  // 学生証作成ボタンのイベントを設定
  document.getElementById('createIdBtn').addEventListener('click', () => {
    const formArea = document.getElementById('formArea');
    formArea.style.display = 'block';
    
    // 診断結果に基づいて学科と部活を設定
    document.getElementById('deptInput').value = result.course;
    document.getElementById('clubInput').value = result.club;
    
    quizContainer.style.display = 'none';
  });
}

// 結果を計算する関数
function calcResult() {
  const bestCourse = Object.entries(tally.course).sort((a,b) => b[1]-a[1])[0][0];
  const bestClub = Object.entries(tally.club).length
    ? Object.entries(tally.club).sort((a,b) => b[1]-a[1])[0][0]
    : 'なし';
  const vibeLabel = tally.vibe < 5 ? 'クール志向'
                  : tally.vibe < 15 ? 'バランス型'
                  : 'アグレッシブ派';
  return { course: bestCourse, club: bestClub, vibe: vibeLabel };
}

// プレビューメッセージを生成する関数
function makePreviewMessage(result) {
  const tpl = previewTemplates[Math.floor(Math.random() * previewTemplates.length)];
  return tpl.replace(/\$\{course\}/g, result.course)
            .replace(/\$\{club\}/g, result.club);
}

// 初期化処理
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('startBtn').addEventListener('click', startQuiz);
});

// エクスポート
export { startQuiz }; 
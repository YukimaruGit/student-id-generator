// 診断質問データ
const questions = [
  {
    question: '放課後、あなたはどこで過ごすことが多い？',
    choices: [
      { text: '図書室で読書', type: 'literary' },
      { text: '音楽室で練習', type: 'artistic' },
      { text: '運動場で部活', type: 'athletic' },
      { text: '美術室でスケッチ', type: 'artistic' }
    ]
  },
  {
    question: '休み時間、友達との会話で盛り上がるのは？',
    choices: [
      { text: '好きな本や小説の話', type: 'literary' },
      { text: '新しい曲や音楽の話', type: 'artistic' },
      { text: 'スポーツの試合結果', type: 'athletic' },
      { text: '美術館の展示の話', type: 'artistic' }
    ]
  },
  {
    question: '将来の夢は？',
    choices: [
      { text: '作家になりたい', type: 'literary' },
      { text: 'ミュージシャンになりたい', type: 'artistic' },
      { text: 'プロ選手になりたい', type: 'athletic' },
      { text: 'アーティストになりたい', type: 'artistic' }
    ]
  }
];

// 診断結果データ
const results = {
  literary: {
    title: '文学の才能あふれる知的タイプ',
    summary: '物語を愛し、言葉の世界に没頭するあなたには文学科がぴったり。図書委員会での活動も期待されています。',
    department: '普通科（特進コース）',
    club: '図書委員会'
  },
  artistic: {
    title: '芸術的センス抜群の表現者タイプ',
    summary: '豊かな感性と表現力を持つあなたには芸術科がおすすめ。音楽や美術を通じて才能を開花させましょう。',
    department: '芸術科（音楽コース・美術コース）',
    club: '放課後探検部'
  },
  athletic: {
    title: 'スポーツ万能のアクティブタイプ',
    summary: '体を動かすことが大好きなあなたには体育科が最適。運動部での活躍が期待されています。',
    department: '普通科（英語コース）',
    club: '怪異研究部'
  }
};

let currentQuestion = 0;
let userAnswers = [];

// 診断を開始する関数
function startQuiz() {
  document.getElementById('startContainer').style.display = 'none';
  document.getElementById('quizContainer').style.display = 'block';
  displayQuestion();
}

// 質問を表示する関数
function displayQuestion() {
  const quizContainer = document.getElementById('quizContainer');
  const question = questions[currentQuestion];
  
  const html = `
    <div class="question-card">
      <h2>質問 ${currentQuestion + 1}</h2>
      <p>${question.question}</p>
      <div class="choices">
        ${question.choices.map((choice, index) => `
          <button class="choice-btn" data-type="${choice.type}">${choice.text}</button>
        `).join('')}
      </div>
    </div>
  `;
  
  quizContainer.innerHTML = html;
  
  // 選択肢のクリックイベントを設定
  document.querySelectorAll('.choice-btn').forEach(button => {
    button.addEventListener('click', handleChoice);
  });
}

// 選択肢が選ばれたときの処理
function handleChoice(event) {
  const selectedType = event.target.dataset.type;
  userAnswers.push(selectedType);
  
  if (currentQuestion < questions.length - 1) {
    currentQuestion++;
    displayQuestion();
  } else {
    showResult();
  }
}

// 診断結果を表示する関数
function showResult() {
  // 最も多く選ばれたタイプを集計
  const typeCounts = userAnswers.reduce((acc, type) => {
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {});
  
  const resultType = Object.entries(typeCounts)
    .sort((a, b) => b[1] - a[1])[0][0];
  
  const result = results[resultType];
  
  // 結果を表示
  const quizContainer = document.getElementById('quizContainer');
  quizContainer.innerHTML = `
    <div class="result-card">
      <h2>診断結果</h2>
      <h3>${result.title}</h3>
      <p>${result.summary}</p>
      <button id="createIdBtn" class="btn-create">学生証を作成</button>
    </div>
  `;
  
  // 学生証作成ボタンのイベントを設定
  document.getElementById('createIdBtn').addEventListener('click', () => {
    // フォームエリアを表示
    const formArea = document.getElementById('formArea');
    formArea.style.display = 'block';
    
    // 診断結果に基づいて学科と部活を設定
    document.getElementById('deptInput').value = result.department;
    document.getElementById('clubInput').value = result.club;
    
    // 診断エリアを非表示
    quizContainer.style.display = 'none';
  });
}

// 診断をリセットする関数
function resetQuiz() {
  currentQuestion = 0;
  userAnswers = [];
  
  // すべての画面を非表示
  document.getElementById('quizContainer').style.display = 'none';
  document.getElementById('formArea').style.display = 'none';
  document.getElementById('previewArea').style.display = 'none';
  
  // 開始画面を表示
  document.getElementById('startContainer').style.display = 'block';
}

// 初期化処理
document.addEventListener('DOMContentLoaded', () => {
  // 開始ボタンのイベントリスナーを設定
  document.getElementById('startBtn').addEventListener('click', startQuiz);
});

// エクスポート
export { displayQuestion, resetQuiz }; 
// 効果音の準備（一時的にコメントアウト）
/*
const SOUNDS = {
  bell: new Audio('assets/sounds/bell.mp3'),
  chalk: new Audio('assets/sounds/chalk.mp3'),
  flip: new Audio('assets/sounds/flip.mp3')
};
*/

// 一時的な効果音の代替処理
const SOUNDS = {
  bell: { play: () => console.log('Bell sound effect') },
  chalk: { play: () => console.log('Chalk sound effect') },
  flip: { play: () => console.log('Flip sound effect') }
};

// 質問データ
const questions = [
  {
    text: "あなたの性格は？",
    options: [
      { text: "論理的で計画的", value: "science" },
      { text: "創造的で芸術的", value: "art" },
      { text: "社交的で活発", value: "sports" },
      { text: "思いやりがある", value: "welfare" }
    ]
  },
  {
    text: "休日の過ごし方は？",
    options: [
      { text: "新しいことを研究する", value: "science" },
      { text: "創作活動に没頭する", value: "art" },
      { text: "外で体を動かす", value: "sports" },
      { text: "誰かの手伝いをする", value: "welfare" }
    ]
  },
  {
    text: "将来なりたいものは？",
    options: [
      { text: "研究者・技術者", value: "science" },
      { text: "クリエイター", value: "art" },
      { text: "アスリート・指導者", value: "sports" },
      { text: "医療・福祉従事者", value: "welfare" }
    ]
  }
];

// 診断結果データ
const results = {
  science: {
    course: "理数科学科",
    club: "科学部"
  },
  art: {
    course: "芸術創作科",
    club: "美術部"
  },
  sports: {
    course: "スポーツ科学科",
    club: "陸上競技部"
  },
  welfare: {
    course: "生活福祉科",
    club: "ボランティア部"
  }
};

// 状態管理
let currentQuestionIndex = 0;
let answers = [];

// DOM要素
const startContainer = document.getElementById("startContainer");
const quizContainer = document.getElementById("quizContainer");
const formArea = document.getElementById("formArea");
const progressBar = document.querySelector(".progress-bar");

// 開始ボタンのイベントリスナー
document.getElementById("startBtn").addEventListener("click", startQuiz);

// 診断を開始する
function startQuiz() {
  startContainer.style.display = "none";
  quizContainer.style.display = "block";
  currentQuestionIndex = 0;
  answers = [];
  showQuestion();
}

// 質問を表示する
function showQuestion() {
  const question = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
  progressBar.style.width = `${progress}%`;

  // 質問カードを作成
  const card = document.createElement("div");
  card.className = "question-card";
  card.innerHTML = `
    <h2 class="question-text">${question.text}</h2>
    <div class="options-container">
      ${question.options.map((option, index) => `
        <button class="option-btn" data-value="${option.value}">
          ${option.text}
        </button>
      `).join("")}
    </div>
  `;

  // 既存の質問カードを削除
  const existingCard = quizContainer.querySelector(".question-card");
  if (existingCard) {
    existingCard.remove();
  }

  // 新しい質問カードを追加
  quizContainer.appendChild(card);

  // オプションボタンにイベントリスナーを追加
  const optionButtons = card.querySelectorAll(".option-btn");
  optionButtons.forEach(button => {
    button.addEventListener("click", () => handleAnswer(button.dataset.value));
  });
}

// 回答を処理する
function handleAnswer(answer) {
  answers.push(answer);

  if (currentQuestionIndex < questions.length - 1) {
    currentQuestionIndex++;
    showQuestion();
  } else {
    showResult();
  }
}

// 診断結果を表示する
function showResult() {
  // 最も多い回答を集計
  const counts = answers.reduce((acc, val) => {
    acc[val] = (acc[val] || 0) + 1;
    return acc;
  }, {});

  // 最も多い回答を見つける
  const result = Object.entries(counts).reduce((a, b) => 
    counts[a[0]] > counts[b[0]] ? a : b
  )[0];

  // デバッグログ
  console.log('【DEBUG】診断結果 →', {
    result,
    resultData: results[result] || '未設定'
  });

  // 結果を学生証フォームに反映
  if (!results[result]) {
    console.error('診断結果が未定義です:', result);
    window.setDiagnosisResult('未設定', '未設定');
    return;
  }

  window.setDiagnosisResult(results[result].course, results[result].club);

  // 画面遷移
  quizContainer.style.display = "none";
  formArea.style.display = "block";
}

// リセット機能
function resetQuiz() {
  currentQuestionIndex = 0;
  answers = [];
  startContainer.style.display = "block";
  quizContainer.style.display = "none";
  formArea.style.display = "none";
  document.getElementById("previewArea").style.display = "none";
  
  // プログレスバーをリセット
  progressBar.style.width = "0%";
  
  // 質問カードを削除
  const existingCard = quizContainer.querySelector(".question-card");
  if (existingCard) {
    existingCard.remove();
  }
}

// エクスポート
export { startQuiz, showQuestion, showResult, resetQuiz }; 
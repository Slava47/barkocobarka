/**
 * Quiz data and recommendation engine for Li Bo Tea Bar
 * Questions, options, and matching logic.
 * In production this is fetched from the admin API.
 */

const QUIZ_DATA = {
  questions: [
    {
      id: 1,
      text: 'Какой вкус Вам ближе?',
      options: [
        { label: 'Сладкий и нежный', value: 'сладкий' },
        { label: 'Терпкий и насыщенный', value: 'терпкий' },
        { label: 'Кисловатый и свежий', value: 'цитрусовый' }
      ]
    },
    {
      id: 2,
      text: 'Какие ноты Вы предпочитаете?',
      options: [
        { label: 'Фруктовые', value: 'фруктовый' },
        { label: 'Травяные и землистые', value: 'травяной' },
        { label: 'Цветочные', value: 'цветочный' }
      ]
    },
    {
      id: 3,
      text: 'Напиток должен быть...',
      options: [
        { label: 'Освежающим и прохладным', value: 'освежающий' },
        { label: 'Согревающим и обволакивающим', value: 'согревающий' },
        { label: 'Не имеет значения', value: 'любой_температура' }
      ]
    },
    {
      id: 4,
      text: 'Насколько крепкий вкус Вы предпочитаете?',
      options: [
        { label: 'Лёгкий и деликатный', value: 'лёгкий' },
        { label: 'Средний и сбалансированный', value: 'средний' },
        { label: 'Насыщенный и глубокий', value: 'насыщенный' }
      ]
    },
    {
      id: 5,
      text: 'Желаете ли Вы алкогольный напиток?',
      options: [
        { label: 'Да, с удовольствием', value: 'алко_да' },
        { label: 'Нет, безалкогольный', value: 'алко_нет' },
        { label: 'Не принципиально', value: 'алко_любой' }
      ]
    }
  ]
};

/**
 * Recommendation engine: scores each menu item against user answers.
 * @param {string[]} answers  – array of 5 answer values
 * @param {object[]} items    – menu items with `tags` arrays
 * @returns {object[]}        – top 3 items with `score` and `reason`
 */
function getRecommendations(answers, items) {
  const alcoAnswer = answers[4];

  let pool = items;
  if (alcoAnswer === 'алко_нет') {
    pool = items.filter(i => i.category !== 'alco' && i.category !== 'tincture');
  } else if (alcoAnswer === 'алко_да') {
    pool = items.filter(i => i.category === 'alco' || i.category === 'tincture');
  }

  const searchTags = answers.slice(0, 4).filter(a => !a.startsWith('любой'));

  const scored = pool.map(item => {
    let score = 0;
    const matched = [];

    searchTags.forEach(tag => {
      if (item.tags.includes(tag)) {
        score += 2;
        matched.push(tag);
      }
    });

    /* partial synonym matching */
    const synonyms = {
      'сладкий': ['мягкий', 'молочный'],
      'терпкий': ['крепкий', 'дымный', 'землистый'],
      'цитрусовый': ['освежающий', 'свежий'],
      'фруктовый': ['экзотический'],
      'травяной': ['землистый', 'свежий'],
      'цветочный': ['мягкий'],
      'освежающий': ['холодный', 'свежий'],
      'согревающий': ['тёплый', 'пряный'],
      'лёгкий': ['мягкий', 'свежий'],
      'средний': ['классический', 'сбалансированный'],
      'насыщенный': ['крепкий', 'дымный', 'пряный']
    };

    searchTags.forEach(tag => {
      const syns = synonyms[tag] || [];
      syns.forEach(s => {
        if (item.tags.includes(s) && !matched.includes(s)) {
          score += 1;
          matched.push(s);
        }
      });
    });

    return { ...item, score, matched };
  });

  scored.sort((a, b) => b.score - a.score);

  const top3 = scored.slice(0, 3);

  const reasonMap = {
    'сладкий': 'сладкий вкус',
    'терпкий': 'терпкие ноты',
    'цитрусовый': 'цитрусовая свежесть',
    'фруктовый': 'фруктовый характер',
    'травяной': 'травяные ноты',
    'цветочный': 'цветочный аромат',
    'освежающий': 'освежающий эффект',
    'согревающий': 'согревающие свойства',
    'лёгкий': 'лёгкий вкус',
    'средний': 'сбалансированный характер',
    'насыщенный': 'насыщенный вкус',
    'мягкий': 'мягкость',
    'крепкий': 'крепкий характер',
    'дымный': 'дымные ноты',
    'пряный': 'пряный букет',
    'холодный': 'прохладная подача',
    'экзотический': 'экзотические нотки',
    'молочный': 'молочная мягкость',
    'свежий': 'свежесть',
    'землистый': 'землистую глубину',
    'имбирный': 'имбирные ноты'
  };

  return top3.map(item => {
    const reasons = item.matched
      .slice(0, 3)
      .map(t => reasonMap[t] || t)
      .join(', ');
    return {
      ...item,
      reason: reasons
        ? `Подходит благодаря: ${reasons}.`
        : 'Отличный выбор для знакомства с нашим меню.'
    };
  });
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { QUIZ_DATA, getRecommendations };
}

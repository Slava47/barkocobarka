/**
 * Quiz data for Li Bo Tea Bar (Ли Бо — Чайный Бар)
 * Contains quiz questions and recommendation algorithm.
 */

const QUIZ_DATA = {
    questions: [
        {
            text: 'Какой вкус Вам ближе?',
            options: [
                { label: 'Сладкий, мягкий', value: 'сладкий' },
                { label: 'Кислый, освежающий', value: 'кислый' },
                { label: 'Крепкий, насыщенный', value: 'крепкий' },
                { label: 'Пряный, согревающий', value: 'пряный' }
            ]
        },
        {
            text: 'Предпочитаете горячее или холодное?',
            options: [
                { label: 'Горячее', value: 'тёплый' },
                { label: 'Холодное', value: 'холодный' },
                { label: 'Без разницы', value: 'любой' }
            ]
        },
        {
            text: 'Хотите ли Вы алкогольный напиток?',
            options: [
                { label: 'Да', value: 'алкогольный' },
                { label: 'Нет', value: 'безалкогольный' },
                { label: 'Не важно', value: 'любой_алко' }
            ]
        },
        {
            text: 'Какое настроение Вы хотите создать?',
            options: [
                { label: 'Расслабиться и отдохнуть', value: 'мягкий' },
                { label: 'Взбодриться', value: 'бодрящий' },
                { label: 'Удивить себя чем-то необычным', value: 'необычный' },
                { label: 'Насладиться классикой', value: 'классический' }
            ]
        },
        {
            text: 'Какие ноты Вам нравятся больше?',
            options: [
                { label: 'Цветочные, травяные', value: 'цветочный' },
                { label: 'Фруктовые, ягодные', value: 'фруктовый' },
                { label: 'Дымные, землистые', value: 'дымный' },
                { label: 'Десертные, молочные', value: 'десертный' }
            ]
        }
    ]
};

function getRecommendations(answers, items) {
    var scored = items.map(function (item) {
        var score = 0;
        answers.forEach(function (ans) {
            if (ans === 'любой' || ans === 'любой_алко') return;
            if (ans === 'безалкогольный') {
                if (item.category !== 'alco') score += 2;
                else score -= 5;
                return;
            }
            if (ans === 'алкогольный') {
                if (item.category === 'alco' || item.category === 'tincture') score += 3;
                return;
            }
            item.tags.forEach(function (tag) {
                if (tag === ans) score += 2;
                if (tag.indexOf(ans) !== -1 || ans.indexOf(tag) !== -1) score += 1;
            });
        });
        return { item: item, score: score };
    });
    scored.sort(function (a, b) { return b.score - a.score; });
    return scored.slice(0, 3).map(function (s) {
        return {
            id: s.item.id,
            name: s.item.name,
            price: s.item.price,
            description: s.item.description,
            image: s.item.image,
            images: s.item.images,
            fullDescription: s.item.fullDescription,
            tags: s.item.tags,
            category: s.item.category,
            reason: 'Подобрано по Вашим предпочтениям'
        };
    });
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { QUIZ_DATA: QUIZ_DATA, getRecommendations: getRecommendations };
}

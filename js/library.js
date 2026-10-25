// Готові набори завдань за віком. price — у монетках (у режимі гривень множиться на курс монетки).
// Гігієна й самообслуговування — 0: це не робота, лише серія 🔥.
// repeat: daily — раз на день, any — скільки завгодно, once — один раз.
// time (для щоденних): morning — ранок, evening — вечір, без time — будь-коли протягом дня.

export const AGE_GROUPS = [
  { id: '4-5', title: '4–5 років', theme: 'kitty' },
  { id: '6-7', title: '6–7 років', theme: 'kitty' },
  { id: '8-10', title: '8–10 років', theme: 'space' },
];

export const LIBRARY = {
  '4-5': [
    { icon: '🛏️', title: 'Застелити ліжко', price: 1, repeat: 'daily', time: 'morning' },
    { icon: '🧸', title: 'Прибрати іграшки', price: 1, repeat: 'daily', time: 'evening' },
    { icon: '🍽️', title: 'Віднести тарілку після їжі', price: 1, repeat: 'daily' },
    { icon: '👕', title: 'Покласти одяг у кошик', price: 1, repeat: 'daily', time: 'evening' },
    { icon: '👟', title: 'Поставити взуття на місце', price: 1, repeat: 'daily', time: 'evening' },
    { icon: '🪥', title: 'Почистити зубки', price: 0, repeat: 'daily' },
    { icon: '👗', title: 'Одягтися самостійно', price: 0, repeat: 'daily', time: 'morning' },
    { icon: '🐱', title: 'Погодувати тваринку', price: 1, repeat: 'daily' },
    { icon: '🛒', title: 'Допомогти розкласти покупки', price: 2, repeat: 'any' },
    { icon: '🧦', title: 'Розкласти шкарпетки по парах', price: 2, repeat: 'any' },
    { icon: '🌱', title: 'Полити квіти', price: 1, repeat: 'any' },
    { icon: '🥄', title: 'Розкласти ложки й серветки', price: 1, repeat: 'any' },
    { icon: '🧽', title: 'Витерти стіл', price: 1, repeat: 'any' },
    { icon: '📚', title: 'Поставити книжки на поличку', price: 1, repeat: 'any' },
    { icon: '♻️', title: 'Посортувати сміття', price: 1, repeat: 'any' },
    { icon: '🧹', title: 'Допомогти прибрати кімнату', price: 3, repeat: 'any' },
  ],
  '6-7': [
    { icon: '🛏️', title: 'Застелити ліжко', price: 1, repeat: 'daily', time: 'morning' },
    { icon: '🎒', title: 'Зібрати речі на завтра', price: 1, repeat: 'daily', time: 'evening' },
    { icon: '🍽️', title: 'Прибрати посуд у мийку', price: 1, repeat: 'daily' },
    { icon: '📖', title: 'Почитати 15 хвилин', price: 1, repeat: 'daily', time: 'evening' },
    { icon: '🐶', title: 'Погодувати й напоїти тваринку', price: 1, repeat: 'daily' },
    { icon: '🥗', title: 'Допомогти приготувати салат', price: 2, repeat: 'any' },
    { icon: '🧺', title: 'Розкласти чисту білизну', price: 2, repeat: 'any' },
    { icon: '🌱', title: 'Полити квіти', price: 1, repeat: 'any' },
    { icon: '🧹', title: 'Підмести або пропилососити кімнату', price: 3, repeat: 'any' },
    { icon: '🗑️', title: 'Винести сміття', price: 2, repeat: 'any' },
    { icon: '🪶', title: 'Протерти пил на поличках', price: 2, repeat: 'any' },
    { icon: '🚰', title: 'Помити раковину', price: 2, repeat: 'any' },
  ],
  '8-10': [
    { icon: '🧹', title: 'Прибрати свою кімнату повністю', price: 3, repeat: 'any' },
    { icon: '🍽️', title: 'Розвантажити посудомийку', price: 2, repeat: 'any' },
    { icon: '♻️', title: 'Винести й відсортувати сміття', price: 2, repeat: 'any' },
    { icon: '🧺', title: 'Розвішати прання', price: 3, repeat: 'any' },
    { icon: '🍳', title: 'Приготувати сніданок', price: 4, repeat: 'any' },
    { icon: '🌀', title: 'Пропилососити квартиру', price: 5, repeat: 'any' },
    { icon: '🐕', title: 'Вигуляти собаку', price: 3, repeat: 'any' },
    { icon: '✏️', title: 'Домашка без нагадувань', price: 2, repeat: 'daily' },
    { icon: '📝', title: 'Скласти список покупок', price: 2, repeat: 'any' },
    { icon: '🛁', title: 'Помити ванну', price: 5, repeat: 'any' },
    { icon: '✨', title: 'Допомогти з генеральним прибиранням', price: 5, repeat: 'any' },
  ],
};

export const TASK_ICONS = ['🛏️', '🧸', '🍽️', '🪥', '👕', '👟', '🐱', '🌱', '🥄', '🧦', '🛒', '📚', '🧽', '🧹', '🗑️', '🧺', '🍳', '🥗', '📖', '🎒', '👗', '🐶', '🎨', '🎹', '⚽', '🛁', '💤', '🦷', '🙏', '⭐'];

export const WISH_ICONS = ['🧸', '🦄', '🎨', '🚲', '🎮', '📚', '🍭', '👗', '🎀', '🐰', '🛼', '🎁', '🍦', '🧩', '🎈', '🎠'];

// Наліпки: одна за кожні STICKER_EVERY виконаних справ, по черзі.
export const STICKER_EVERY = 10;
export const STICKERS = ['🎀', '🍓', '🌸', '🦄', '🐰', '🧁', '🌈', '🦋', '🍭', '🐱', '🌷', '🍒', '💖', '🎈', '🐣', '🦢', '🍩', '🌙', '⭐', '🐼', '🍉', '🦊', '🌻', '🐬', '🍪', '🎠', '🐨', '🍦', '🪐', '👑'];

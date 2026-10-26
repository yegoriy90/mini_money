// Готові набори завдань за віком. price — у монетках (у режимі гривень множиться на курс монетки).
// Гігієна й самообслуговування — 0: це не робота, лише серія 🔥.
// repeat: daily — раз на день, any — скільки завгодно, once — один раз.
// time (для щоденних): morning — ранок, evening — вечір, both — двічі (ранок і вечір окремо), без time — будь-коли протягом дня.

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
    { icon: '🪥', title: 'Почистити зубки', price: 0, repeat: 'daily', time: 'both' },
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
// Згенеровані наліпки (Magnific, tools/cut_stickers.py) — у порядку, в якому дитина їх відкриває.
export const STICKERS = [
  { img: 'assets/stickers/19.webp', name: 'Єдиноріг' },
  { img: 'assets/stickers/01.webp', name: 'Полуничка' },
  { img: 'assets/stickers/10.webp', name: 'Зайчик' },
  { img: 'assets/stickers/20.webp', name: 'Веселка' },
  { img: 'assets/stickers/02.webp', name: 'Капкейк' },
  { img: 'assets/stickers/14.webp', name: 'Котик' },
  { img: 'assets/stickers/22.webp', name: 'Зірочка' },
  { img: 'assets/stickers/03.webp', name: 'Морозиво' },
  { img: 'assets/stickers/11.webp', name: 'Панда' },
  { img: 'assets/stickers/25.webp', name: 'Метелик' },
  { img: 'assets/stickers/04.webp', name: 'Пончик' },
  { img: 'assets/stickers/12.webp', name: 'Лисичка' },
  { img: 'assets/stickers/24.webp', name: 'Корона' },
  { img: 'assets/stickers/32.webp', name: 'Бантик' },
  { img: 'assets/stickers/15.webp', name: 'Каченя' },
  { img: 'assets/stickers/21.webp', name: 'Місяць' },
  { img: 'assets/stickers/09.webp', name: 'Печиво' },
  { img: 'assets/stickers/16.webp', name: 'Хом’ячок' },
  { img: 'assets/stickers/26.webp', name: 'Хмаринка' },
  { img: 'assets/stickers/06.webp', name: 'Вишеньки' },
  { img: 'assets/stickers/17.webp', name: 'Пінгвін' },
  { img: 'assets/stickers/23.webp', name: 'Чарівна паличка' },
  { img: 'assets/stickers/29.webp', name: 'Подарунок' },
  { img: 'assets/stickers/07.webp', name: 'Макарун' },
  { img: 'assets/stickers/18.webp', name: 'Цуцик' },
  { img: 'assets/stickers/27.webp', name: 'Планета' },
  { img: 'assets/stickers/31.webp', name: 'Ведмедик' },
  { img: 'assets/stickers/05.webp', name: 'Льодяник' },
  { img: 'assets/stickers/13.webp', name: 'Коала' },
  { img: 'assets/stickers/33.webp', name: 'Квіточка' },
  { img: 'assets/stickers/08.webp', name: 'Кавун' },
  { img: 'assets/stickers/30.webp', name: 'Кулька' },
  { img: 'assets/stickers/35.webp', name: 'Сердечко' },
  { img: 'assets/stickers/36.webp', name: 'Будиночок' },
  { img: 'assets/stickers/34.webp', name: 'Монетка' },
  { img: 'assets/stickers/28.webp', name: 'Скарбничка' },
];

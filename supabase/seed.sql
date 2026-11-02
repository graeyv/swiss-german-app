-- Starter content in Zürich German. Safe to run more than once.
-- Swiss German spelling varies by writer: have a native speaker review this before launch.

insert into public.dialects (id, name) values
  ('zh', 'Züritüütsch (Zürich)')
on conflict (id) do nothing;

insert into public.courses (dialect_id, slug, title, description, level, position, published) values
  ('zh', 'zh-first-steps', 'First Steps', 'Get through your first conversations in Zürich.', 'A1', 1, true)
on conflict (slug) do nothing;

insert into public.lessons (course_id, slug, title, description, position, published)
select c.id, l.slug, l.title, l.description, l.position, true
from (values
  ('greetings', 'Grüezi!', 'Say hello, ask how someone is, and say goodbye.', 1),
  ('at-the-cafe', 'Im Café', 'Order a coffee and pay the bill.', 2)
) as l (slug, title, description, position)
join public.courses c on c.slug = 'zh-first-steps'
on conflict (slug) do nothing;

-- Words shared with the flashcard decks (FC codes) are kept up to date by content/cards.tsv.
insert into public.vocabulary_items (code, dialect_id, swiss_german, high_german, english, notes) values
  ('FC0004', 'zh', 'Grüezi', 'Guten Tag', 'Hello', 'Polite: use it with strangers. For several people, say "Grüezi mitenand".'),
  ('FC0001', 'zh', 'Hoi', 'Hallo', 'Hi', 'Informal: use it with friends and people you know.'),
  ('L0001', 'zh', 'Wie gaht''s?', 'Wie geht''s?', 'How are you?', null),
  ('L0002', 'zh', 'Mir gaht''s guet', 'Mir geht es gut', 'I''m doing well', null),
  ('L0003', 'zh', 'Merci vilmal', 'Vielen Dank', 'Thank you very much', null),
  ('L0004', 'zh', 'Uf Widerluege', 'Auf Wiedersehen', 'Goodbye', 'Polite: the counterpart to "Grüezi".'),
  ('L0005', 'zh', 'Tschüss', 'Tschüss', 'Bye', 'Informal: the counterpart to "Hoi".'),
  ('L0006', 'zh', 'en Kafi', 'ein Kaffee', 'a coffee', null),
  ('L0007', 'zh', 'es Gipfeli', 'ein Croissant', 'a croissant', null),
  ('L0008', 'zh', 'Ich hett gern ...', 'Ich hätte gern ...', 'I would like ...', null),
  ('L0009', 'zh', 'Zale, bitte!', 'Zahlen, bitte!', 'The bill, please!', null),
  ('L0010', 'zh', 'En Guete!', 'Guten Appetit!', 'Enjoy your meal!', 'Said to everyone at the table before eating.')
on conflict (code) do nothing;

insert into public.exercises (lesson_id, position, type, vocabulary_id, payload)
select l.id, e.position, e.type::public.exercise_type, v.id, e.payload::jsonb
from (values
  ('greetings', 1, 'vocab_card', 'FC0004', '{}'),
  ('greetings', 2, 'vocab_card', 'FC0001', '{}'),
  ('greetings', 3, 'multiple_choice', 'FC0004',
    '{"question": "How do you greet a stranger politely?", "options": ["Hoi", "Grüezi", "Tschüss"], "answer_index": 1}'),
  ('greetings', 4, 'vocab_card', 'L0001', '{}'),
  ('greetings', 5, 'vocab_card', 'L0002', '{}'),
  ('greetings', 6, 'word_order', 'L0002',
    '{"prompt": "I''m doing well, thank you.", "words": ["guet,", "Mir", "merci.", "gaht''s"], "answer": ["Mir", "gaht''s", "guet,", "merci."]}'),
  ('greetings', 7, 'vocab_card', 'L0003', '{}'),
  ('greetings', 8, 'vocab_card', 'L0004', '{}'),
  ('greetings', 9, 'vocab_card', 'L0005', '{}'),
  ('greetings', 10, 'multiple_choice', 'L0004',
    '{"question": "What does \"Uf Widerluege\" mean?", "options": ["Thank you very much", "How are you?", "Goodbye"], "answer_index": 2}'),
  ('at-the-cafe', 1, 'vocab_card', 'L0006', '{}'),
  ('at-the-cafe', 2, 'vocab_card', 'L0007', '{}'),
  ('at-the-cafe', 3, 'vocab_card', 'L0008', '{}'),
  ('at-the-cafe', 4, 'word_order', 'L0008',
    '{"prompt": "I would like a coffee, please.", "words": ["en", "bitte.", "hett", "Ich", "Kafi,", "gern"], "answer": ["Ich", "hett", "gern", "en", "Kafi,", "bitte."]}'),
  ('at-the-cafe', 5, 'vocab_card', 'L0010', '{}'),
  ('at-the-cafe', 6, 'multiple_choice', 'L0010',
    '{"question": "What do you say before everyone starts eating?", "options": ["En Guete!", "Zale, bitte!", "Merci vilmal"], "answer_index": 0}'),
  ('at-the-cafe', 7, 'vocab_card', 'L0009', '{}'),
  ('at-the-cafe', 8, 'multiple_choice', 'L0009',
    '{"question": "You are ready to pay. What do you say?", "options": ["Hoi", "En Guete!", "Zale, bitte!"], "answer_index": 2}')
) as e (lesson_slug, position, type, vocabulary_code, payload)
join public.lessons l on l.slug = e.lesson_slug
join public.vocabulary_items v on v.code = e.vocabulary_code
on conflict (lesson_id, position) do nothing;

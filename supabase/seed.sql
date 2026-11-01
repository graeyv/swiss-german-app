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

insert into public.vocabulary_items (dialect_id, swiss_german, high_german, english, notes) values
  ('zh', 'Grüezi', 'Guten Tag', 'Hello', 'Polite: use it with strangers. For several people, say "Grüezi mitenand".'),
  ('zh', 'Hoi', 'Hallo', 'Hi', 'Informal: use it with friends and people you know.'),
  ('zh', 'Wie gaht''s?', 'Wie geht''s?', 'How are you?', null),
  ('zh', 'Mir gaht''s guet', 'Mir geht es gut', 'I''m doing well', null),
  ('zh', 'Merci vilmal', 'Vielen Dank', 'Thank you very much', null),
  ('zh', 'Uf Widerluege', 'Auf Wiedersehen', 'Goodbye', 'Polite: the counterpart to "Grüezi".'),
  ('zh', 'Tschüss', 'Tschüss', 'Bye', 'Informal: the counterpart to "Hoi".'),
  ('zh', 'en Kafi', 'ein Kaffee', 'a coffee', null),
  ('zh', 'es Gipfeli', 'ein Croissant', 'a croissant', null),
  ('zh', 'Ich hett gern ...', 'Ich hätte gern ...', 'I would like ...', null),
  ('zh', 'Zale, bitte!', 'Zahlen, bitte!', 'The bill, please!', null),
  ('zh', 'En Guete!', 'Guten Appetit!', 'Enjoy your meal!', 'Said to everyone at the table before eating.')
on conflict (dialect_id, swiss_german) do nothing;

insert into public.exercises (lesson_id, position, type, vocabulary_id, payload)
select l.id, e.position, e.type::public.exercise_type, v.id, e.payload::jsonb
from (values
  ('greetings', 1, 'vocab_card', 'Grüezi', '{}'),
  ('greetings', 2, 'vocab_card', 'Hoi', '{}'),
  ('greetings', 3, 'multiple_choice', 'Grüezi',
    '{"question": "How do you greet a stranger politely?", "options": ["Hoi", "Grüezi", "Tschüss"], "answer_index": 1}'),
  ('greetings', 4, 'vocab_card', 'Wie gaht''s?', '{}'),
  ('greetings', 5, 'vocab_card', 'Mir gaht''s guet', '{}'),
  ('greetings', 6, 'word_order', 'Mir gaht''s guet',
    '{"prompt": "I''m doing well, thank you.", "words": ["guet,", "Mir", "merci.", "gaht''s"], "answer": ["Mir", "gaht''s", "guet,", "merci."]}'),
  ('greetings', 7, 'vocab_card', 'Merci vilmal', '{}'),
  ('greetings', 8, 'vocab_card', 'Uf Widerluege', '{}'),
  ('greetings', 9, 'vocab_card', 'Tschüss', '{}'),
  ('greetings', 10, 'multiple_choice', 'Uf Widerluege',
    '{"question": "What does \"Uf Widerluege\" mean?", "options": ["Thank you very much", "How are you?", "Goodbye"], "answer_index": 2}'),
  ('at-the-cafe', 1, 'vocab_card', 'en Kafi', '{}'),
  ('at-the-cafe', 2, 'vocab_card', 'es Gipfeli', '{}'),
  ('at-the-cafe', 3, 'vocab_card', 'Ich hett gern ...', '{}'),
  ('at-the-cafe', 4, 'word_order', 'Ich hett gern ...',
    '{"prompt": "I would like a coffee, please.", "words": ["en", "bitte.", "hett", "Ich", "Kafi,", "gern"], "answer": ["Ich", "hett", "gern", "en", "Kafi,", "bitte."]}'),
  ('at-the-cafe', 5, 'vocab_card', 'En Guete!', '{}'),
  ('at-the-cafe', 6, 'multiple_choice', 'En Guete!',
    '{"question": "What do you say before everyone starts eating?", "options": ["En Guete!", "Zale, bitte!", "Merci vilmal"], "answer_index": 0}'),
  ('at-the-cafe', 7, 'vocab_card', 'Zale, bitte!', '{}'),
  ('at-the-cafe', 8, 'multiple_choice', 'Zale, bitte!',
    '{"question": "You are ready to pay. What do you say?", "options": ["Hoi", "En Guete!", "Zale, bitte!"], "answer_index": 2}')
) as e (lesson_slug, position, type, swiss_german, payload)
join public.lessons l on l.slug = e.lesson_slug
join public.vocabulary_items v on v.dialect_id = 'zh' and v.swiss_german = e.swiss_german
on conflict (lesson_id, position) do nothing;

-- Initial schema for flash-cards D1 database
PRAGMA foreign_keys = ON;

CREATE TABLE decks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE cards (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  deck_id INTEGER NOT NULL REFERENCES decks(id) ON DELETE CASCADE,
  front TEXT NOT NULL,
  back TEXT NOT NULL,
  due TEXT NOT NULL,
  stability REAL NOT NULL DEFAULT 0,
  difficulty REAL NOT NULL DEFAULT 0,
  elapsed_days REAL NOT NULL DEFAULT 0,
  scheduled_days REAL NOT NULL DEFAULT 0,
  learning_steps REAL NOT NULL DEFAULT 0,
  reps INTEGER NOT NULL DEFAULT 0,
  lapses INTEGER NOT NULL DEFAULT 0,
  state INTEGER NOT NULL DEFAULT 0,
  last_review TEXT
);

CREATE INDEX idx_cards_deck_due ON cards(deck_id, due);
CREATE INDEX idx_cards_due ON cards(due);

CREATE TABLE review_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  card_id INTEGER NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL,
  state INTEGER NOT NULL,
  due TEXT NOT NULL,
  stability REAL NOT NULL,
  difficulty REAL NOT NULL,
  elapsed_days REAL NOT NULL,
  last_elapsed_days REAL NOT NULL,
  scheduled_days REAL NOT NULL,
  learning_steps REAL NOT NULL,
  review TEXT NOT NULL
);

CREATE INDEX idx_review_logs_card_id ON review_logs(card_id);

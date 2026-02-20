-- Add index on review_logs.review for stats queries (today's reviews, streak calculation)
CREATE INDEX idx_review_logs_review ON review_logs(review);

ALTER TABLE "instagram_api_hourly" ENABLE ROW LEVEL SECURITY;

--> statement-breakpoint
CREATE POLICY "Allow users to view own instagram api hourly" ON "instagram_api_hourly" FOR SELECT USING (
    account_id IN (
        SELECT id FROM instagram_accounts WHERE user_id = auth.uid()
    )
);

--> statement-breakpoint
CREATE POLICY "Allow users to insert own instagram api hourly" ON "instagram_api_hourly" FOR INSERT WITH CHECK (
    account_id IN (
        SELECT id FROM instagram_accounts WHERE user_id = auth.uid()
    )
);

--> statement-breakpoint
CREATE POLICY "Allow users to update own instagram api hourly" ON "instagram_api_hourly" FOR UPDATE USING (
    account_id IN (
        SELECT id FROM instagram_accounts WHERE user_id = auth.uid()
    )
) WITH CHECK (
    account_id IN (
        SELECT id FROM instagram_accounts WHERE user_id = auth.uid()
    )
);

--> statement-breakpoint
CREATE POLICY "Allow users to delete own instagram api hourly" ON "instagram_api_hourly" FOR DELETE USING (
    account_id IN (
        SELECT id FROM instagram_accounts WHERE user_id = auth.uid()
    )
);

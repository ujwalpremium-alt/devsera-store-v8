DROP POLICY IF EXISTS "Admins can delete orders" ON orders;

CREATE POLICY "Admins can delete orders" ON orders
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

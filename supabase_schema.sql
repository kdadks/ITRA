-- Create users table
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  date_of_birth DATE NOT NULL,
  pan VARCHAR(10) UNIQUE NOT NULL,
  aadhar VARCHAR(12) UNIQUE NOT NULL,
  address JSONB DEFAULT '{}',
  role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin', 'tax_professional')),
  is_verified BOOLEAN DEFAULT FALSE,
  profile_completion INTEGER DEFAULT 0,
  subscription_plan VARCHAR(20) DEFAULT 'free' CHECK (subscription_plan IN ('free', 'basic', 'premium')),
  subscription_start_date TIMESTAMP,
  subscription_end_date TIMESTAMP,
  subscription_is_active BOOLEAN DEFAULT TRUE,
  preferences JSONB DEFAULT '{"notifications": true, "language": "en", "theme": "light"}',
  last_login TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create tax_returns table
CREATE TABLE tax_returns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  assessment_year VARCHAR(10) NOT NULL,
  financial_year VARCHAR(15) NOT NULL,
  itr_form VARCHAR(10) NOT NULL CHECK (itr_form IN ('ITR-1', 'ITR-2', 'ITR-3', 'ITR-4')),
  
  income_details JSONB DEFAULT '{}',
  deductions JSONB DEFAULT '{}',
  tax_computations JSONB DEFAULT '{}',
  bank_details JSONB DEFAULT '{}',
  
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'calculated', 'filed', 'acknowledged', 'processed')),
  acknowledgment_number VARCHAR(50),
  filing_date DATE,
  due_date DATE,
  
  documents JSONB DEFAULT '[]',
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create compliance_deadlines table
CREATE TABLE compliance_deadlines (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  due_date DATE NOT NULL,
  category VARCHAR(50) NOT NULL,
  applies_to VARCHAR(100) DEFAULT 'all',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create user_notifications table
CREATE TABLE user_notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(20) DEFAULT 'info' CHECK (type IN ('info', 'warning', 'error', 'success')),
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create documents table
CREATE TABLE documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tax_return_id UUID REFERENCES tax_returns(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(100) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_size INTEGER,
  mime_type VARCHAR(100),
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_pan ON users(pan);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_tax_returns_user_id ON tax_returns(user_id);
CREATE INDEX idx_tax_returns_status ON tax_returns(status);
CREATE INDEX idx_tax_returns_assessment_year ON tax_returns(assessment_year);
CREATE INDEX idx_documents_user_id ON documents(user_id);
CREATE INDEX idx_documents_tax_return_id ON documents(tax_return_id);
CREATE INDEX idx_user_notifications_user_id ON user_notifications(user_id);
CREATE INDEX idx_user_notifications_is_read ON user_notifications(is_read);

-- Insert some sample compliance deadlines
INSERT INTO compliance_deadlines (title, description, due_date, category) VALUES
('ITR Filing Deadline for Individual Taxpayers', 'Last date for filing ITR for individual taxpayers', '2024-07-31', 'ITR Filing'),
('Advance Tax Payment - Q4', 'Fourth installment of advance tax payment', '2024-03-15', 'Tax Payment'),
('TDS Return Filing - Q4', 'Quarterly TDS return filing deadline', '2024-04-30', 'TDS'),
('GST Return Filing', 'Monthly GST return filing deadline', '2024-04-20', 'GST');

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tax_returns_updated_at BEFORE UPDATE ON tax_returns FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_compliance_deadlines_updated_at BEFORE UPDATE ON compliance_deadlines FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_notifications_updated_at BEFORE UPDATE ON user_notifications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

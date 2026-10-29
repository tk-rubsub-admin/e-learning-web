import { screen } from '@testing-library/react';
import { waitFor } from '@testing-library/react';
import { renderComponent } from 'tests/utils';
import Login from 'pages/Login';

describe('App', () => {
  it('should show login page if user is not authenticated', async () => {
    renderComponent(<Login />);
    await waitFor(
      () => {
        expect(screen.getByLabelText('ชื่อผู้ใช้งาน')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'เข้าสู่ระบบ' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'ลงทะเบียนเข้าใช้งาน' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'ลืมรหัสผ่าน?' })).toBeInTheDocument();
      },
      { timeout: 5000 }
    );
  });
});

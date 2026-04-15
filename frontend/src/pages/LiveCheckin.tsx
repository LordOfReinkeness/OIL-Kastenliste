import { useParams } from 'react-router-dom';
import { PageLayout } from '../components/layout/PageLayout';
import { LiveCheckinPopup } from '../components/popup/LiveCheckinPopup';

export function LiveCheckin() {
  const { token } = useParams<{ token: string }>();

  return (
    <PageLayout>
      <LiveCheckinPopup token={token!} />
    </PageLayout>
  );
}

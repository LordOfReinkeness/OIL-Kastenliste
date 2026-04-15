import { useParams } from 'react-router-dom';
import { PageLayout } from '../components/layout/PageLayout';
import { PostCheckinPopup } from '../components/popup/PostCheckinPopup';

export function PostCheckin() {
  const { token } = useParams<{ token: string }>();

  return (
    <PageLayout>
      <PostCheckinPopup token={token!} />
    </PageLayout>
  );
}

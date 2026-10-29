import { useEffect, useState } from 'react';
import LoadingDialog from 'components/LoadingDialog';
import { getApiLoadingState, subscribeApiLoading } from 'api/loadingState';

export default function GlobalLoadingDialog(): JSX.Element {
  const [open, setOpen] = useState(getApiLoadingState());

  useEffect(() => {
    return subscribeApiLoading(() => {
      setOpen(getApiLoadingState());
    });
  }, []);

  return <LoadingDialog open={open} />;
}

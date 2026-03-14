import { RustDeskServerConfig } from './rustdesk/RustDeskServerConfig';

const RustDeskAdminConfig = () => {
  return <RustDeskServerConfig onClose={() => {}} embedded />;
};

export default RustDeskAdminConfig;

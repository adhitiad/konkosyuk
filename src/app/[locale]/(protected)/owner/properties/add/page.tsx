import AddPropertyDialog from "../add-property-dialog";
import { withKycVerified } from "@/lib/with-kyc-verified";

function AddPropertyPage() {
  return <AddPropertyDialog />;
}

export default withKycVerified(AddPropertyPage, {
  redirectTo: "/owner/settings/kyc",
  showKycPrompt: true,
});

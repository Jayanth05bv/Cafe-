import RegistrationForm from "../components/RegistrationForm";

export default function RegisterCafeOwner() {
    return (
        <RegistrationForm
            roleValue="ROLE_CAFE_OWNER"
            roleLabel="Cafe Owner"
            accentClass="registration-owner"
        />
    );
}

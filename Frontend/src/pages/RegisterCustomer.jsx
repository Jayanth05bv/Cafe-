import RegistrationForm from "../components/RegistrationForm";

export default function RegisterCustomer() {
    return (
        <RegistrationForm
            roleValue="ROLE_CUSTOMER"
            roleLabel="Customer"
            accentClass="registration-customer"
        />
    );
}

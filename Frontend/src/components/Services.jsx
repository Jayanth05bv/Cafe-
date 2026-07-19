export default function Services() {
    const services = [
        {
            title: "Table Booking",
            description: "Reserve your spot before you arrive and skip the uncertainty.",
            color: "s1",
            img: "https://img.icons8.com/color/96/table.png",
        },
        {
            title: "Pre Order",
            description: "Place your order early so your favorites are ready on time.",
            color: "s2",
            img: "https://img.icons8.com/color/96/coffee.png",
        },
        {
            title: "Online Payment",
            description: "Pay quickly and securely with a smoother checkout experience.",
            color: "s3",
            img: "https://img.icons8.com/color/96/mobile-payment.png",
        },
        {
            title: "Order Tracking",
            description: "Follow your order progress from kitchen queue to pickup.",
            color: "s4",
            img: "https://img.icons8.com/color/96/delivery.png",
        },
        {
            title: "Membership Discounts",
            description: "Enjoy special prices, offers, and loyalty perks for regular visits.",
            color: "s5",
            img: "https://img.icons8.com/color/96/loyalty-card.png",
        },
        {
            title: "Live Music Evening",
            description: "Relax with curated evenings that bring more warmth to the cafe.",
            color: "s6",
            img: "https://img.icons8.com/color/96/microphone.png",
        },
        {
            title: "Customized Coffee",
            description: "Make every cup your own with flavors, milk, and roast choices.",
            color: "s7",
            img: "https://img.icons8.com/color/96/coffee-maker.png",
        },
        {
            title: "Take Away",
            description: "Grab your favorites on the go without slowing down your day.",
            color: "s8",
            img: "https://img.icons8.com/color/96/shopping-bag.png",
        },
        {
            title: "Free Wi-Fi",
            description: "Stay connected for work, study, or relaxed browsing over coffee.",
            color: "s9",
            img: "https://img.icons8.com/color/96/wifi.png",
        },
    ];

    return (
        <section id="services" className="services">
            <div className="services-header">
                <h2>Our Services</h2>
                <p>
                    Thoughtfully designed experiences that make every visit smoother,
                    more convenient, and a little more special.
                </p>
            </div>

            <div className="services-grid">
                {services.map((service, index) => (
                    <div
                        key={index}
                        className={`service-box ${service.color}`}
                    >
                        <div className="service-icon-wrap">
                            <img src={service.img} alt={service.title} />
                        </div>
                        <span className="service-kicker">Cafe Benefit</span>
                        <h4>{service.title}</h4>
                        <p>{service.description}</p>
                    </div>
                ))}
            </div>
        </section>
    );
}

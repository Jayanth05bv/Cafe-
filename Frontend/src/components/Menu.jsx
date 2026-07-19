export default function Menu() {
    const menu = [
        {
            name: "Espresso",
            price: "₹90",
            img: "https://images.unsplash.com/photo-1511920170033-f8396924c348",
        },
        {
            name: "Cappuccino",
            price: "₹120",
            img: "https://images.unsplash.com/photo-1509042239860-f550ce710b93",
        },
        {
            name: "Latte",
            price: "₹130",
            img: "https://images.unsplash.com/photo-1523942839745-7848d4a04d76",
        },
        {
            name: "Mocha",
            price: "₹140",
            img: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085",
        },
        {
            name: "Americano",
            price: "₹100",
            img: "https://images.unsplash.com/photo-1504754524776-8f4f37790ca0",
        },
        {
            name: "Cold Coffee",
            price: "₹150",
            img: "https://images.unsplash.com/photo-1541167760496-1628856ab772",
        },
        {
            name: "Caramel Latte",
            price: "₹155",
            img: "https://images.unsplash.com/photo-1554118811-1e0d58224f24",
        },
        {
            name: "Vanilla Latte",
            price: "₹150",
            img: "https://images.unsplash.com/photo-1517705008128-361805f42e86",
        },
        {
            name: "Irish Coffee",
            price: "₹160",
            img: "https://images.unsplash.com/photo-1481391319762-47dff72954d9",
        },
        {
            name: "Filter Coffee",
            price: "₹80",
            img: "https://images.unsplash.com/photo-1509785307050-d4066910ec1e",
        },
    ];

    return (
        <section id="menu" className="menu">
            <h2>Our Menu</h2>
            <div className="menu-grid">
                {menu.map((item, i) => (
                    <div className="menu-item" key={i}>
                        <img src={item.img} alt={item.name} />
                        <div>
                            <h4>{item.name}</h4>
                            <span>{item.price}</span>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}
export default function Footer() {
    return (
        <footer className="footer">
            <div className="footer-content">
                <div className="footer-left">
                    <div className="footer-brand">
                        <span className="footer-brand-mark" aria-hidden="true">BT</span>
                        <div className="footer-brand-copy">
                            <strong>Bean To Cup</strong>
                            <span>Fresh cafe moments</span>
                        </div>
                    </div>
                    <p className="footer-intro">
                        A warm cafe experience for coffee, conversations, and everyday moments.
                    </p>
                    <div className="footer-contact-list">
                        <p>hello@beantocup.com</p>
                        <p>+91 98765 43210</p>
                        <p>Open daily for coffee, brunch, and slow evenings.</p>
                    </div>
                </div>

                <div className="footer-right">
                    <div className="footer-block">
                        <h4>Opening Hours</h4>
                        <p>Mon - Fri: 9 AM - 10 PM</p>
                        <p>Saturday: 10 AM - 11 PM</p>
                        <p>Sunday: 10 AM - 8 PM</p>
                    </div>
                    <div className="footer-block">
                        <h4>Visit</h4>
                        <p>Cozy seating</p>
                        <p>Work-friendly corners</p>
                        <p>Fresh pastries and brews</p>
                    </div>
                    <div className="footer-block">
                        <h4>Follow Us</h4>
                        <div className="footer-socials">
                            <span>Instagram</span>
                            <span>Facebook</span>
                            <span>X</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="footer-bottom">
                <span>Copyright 2026 Bean To Cup Cafe. All rights reserved.</span>
                <span>Crafted for a better cafe experience.</span>
            </div>
        </footer>
    );
}

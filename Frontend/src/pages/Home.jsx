import { Link } from "react-router-dom";
import Services from "../components/Services";

export default function Home() {
    return (
        <>
            {/* HERO */}
            <section id="home" className="hero">
                <div className="hero-text">
                    <span className="hero-kicker">Coffee. Community. Convenience.</span>
                    <h1>Your everyday cafe, made easier online.</h1>
                    <p>
                        Discover the menu, reserve your table, pre-order favorites,
                        and enjoy a smoother cafe experience with Bean To Cup.
                    </p>
                    <div className="hero-actions">
                        <Link to="/select-registration-type" className="hero-register-link">Create account</Link>
                    </div>
                </div>
            </section>

            <Services />

            {/* GALLERY */}
            <section id="gallery" className="gallery">
                <div className="gallery-header">
                    <h2 className="gallery-title">Gallery</h2>
                    <p className="gallery-subtitle">Moments and flavors we love - a glimpse of your next visit</p>
                </div>

                <div className="gallery-grid">
                    <div className="gallery-item gallery-item-featured">
                        <img src="https://images.unsplash.com/photo-1509042239860-f550ce710b93" alt="Coffee and plants" />
                        <span className="gallery-item-overlay" aria-hidden="true" />
                        <div className="gallery-item-copy">
                            <span className="gallery-item-tag">Signature Mood</span>
                            <strong>Fresh brews, calm corners, and warm light.</strong>
                        </div>
                    </div>
                    <div className="gallery-item">
                        <img src="https://images.unsplash.com/photo-1511920170033-f8396924c348" alt="Coffee portafilter" />
                        <span className="gallery-item-overlay" aria-hidden="true" />
                        <div className="gallery-item-copy">
                            <span className="gallery-item-tag">Craft</span>
                            <strong>Barista detail</strong>
                        </div>
                    </div>
                    <div className="gallery-item">
                        <img src="https://images.unsplash.com/photo-1495474472287-4d71bcdd2085" alt="Coffee cups" />
                        <span className="gallery-item-overlay" aria-hidden="true" />
                        <div className="gallery-item-copy">
                            <span className="gallery-item-tag">Coffee</span>
                            <strong>Daily pours</strong>
                        </div>
                    </div>
                    <div className="gallery-item">
                        <img src="https://images.unsplash.com/photo-1504754524776-8f4f37790ca0" alt="Breakfast spread" />
                        <span className="gallery-item-overlay" aria-hidden="true" />
                        <div className="gallery-item-copy">
                            <span className="gallery-item-tag">Breakfast</span>
                            <strong>Slow morning plates</strong>
                        </div>
                    </div>
                    <div className="gallery-item">
                        <img src="https://images.unsplash.com/photo-1541167760496-1628856ab772" alt="Latte art" />
                        <span className="gallery-item-overlay" aria-hidden="true" />
                        <div className="gallery-item-copy">
                            <span className="gallery-item-tag">Latte Art</span>
                            <strong>Hand-finished cups</strong>
                        </div>
                    </div>
                    <div className="gallery-item">
                        <img src="https://images.unsplash.com/photo-1554118811-1e0d58224f24" alt="Cafe interior" />
                        <span className="gallery-item-overlay" aria-hidden="true" />
                        <div className="gallery-item-copy">
                            <span className="gallery-item-tag">Space</span>
                            <strong>Cozy interiors</strong>
                        </div>
                    </div>
                    <div className="gallery-item">
                        <img src="https://images.unsplash.com/photo-1517705008128-361805f42e86" alt="Modern cafe seating" />
                        <span className="gallery-item-overlay" aria-hidden="true" />
                        <div className="gallery-item-copy">
                            <span className="gallery-item-tag">Seating</span>
                            <strong>Meet and unwind</strong>
                        </div>
                    </div>
                    <div className="gallery-item">
                        <img src="https://images.unsplash.com/photo-1481391319762-47dff72954d9" alt="Coffee and pastry" />
                        <span className="gallery-item-overlay" aria-hidden="true" />
                        <div className="gallery-item-copy">
                            <span className="gallery-item-tag">Pastry</span>
                            <strong>Sweet pairings</strong>
                        </div>
                    </div>
                    <div className="gallery-item">
                        <img src="https://images.unsplash.com/photo-1509785307050-d4066910ec1e" alt="Chocolates and treats" />
                        <span className="gallery-item-overlay" aria-hidden="true" />
                        <div className="gallery-item-copy">
                            <span className="gallery-item-tag">Treats</span>
                            <strong>Little indulgences</strong>
                        </div>
                    </div>
                </div>
            </section>

            {/* ABOUT */}
            <section id="about" className="about">
                <div className="about-box">
                    <span className="about-label">Our Story</span>
                    <h2>About Bean To Cup</h2>
                    <p>
                        Bean To Cup is a modern cafe where passion meets perfection. From
                        carefully sourced coffee beans to handcrafted brews, we create a
                        warm space for conversations, creativity, and comfort. Whether
                        you are here to relax, work, or celebrate moments, every cup is
                        brewed with care.
                    </p>
                </div>
            </section>

            <section className="chefs">
                <div className="chefs-header">
                    <h2 className="chefs-title">Our Chefs</h2>
                    <p className="chefs-subtitle">The people behind your favourite brews, bakes, and signature flavors</p>
                </div>

                <div className="chef-grid">
                    <article className="chef-card">
                        <div className="chef-card-image-wrap">
                            <img
                                src="https://images.unsplash.com/photo-1607746882042-944635dfe10e"
                                alt="John Carter, Head Chef"
                            />
                        </div>
                        <div className="chef-card-info">
                            <span className="chef-badge">Signature Craft</span>
                            <span className="chef-name">John Carter</span>
                            <span className="chef-role">Head Chef</span>
                            <p className="chef-note">Known for balanced breakfast plates and house-favorite brunch specials.</p>
                        </div>
                    </article>

                    <article className="chef-card">
                        <div className="chef-card-image-wrap">
                            <img
                                src="https://images.unsplash.com/photo-1595152772835-219674b2a8a6"
                                alt="Riya Sharma, Assistant Chef"
                            />
                        </div>
                        <div className="chef-card-info">
                            <span className="chef-badge">Daily Fresh</span>
                            <span className="chef-name">Riya Sharma</span>
                            <span className="chef-role">Assistant Chef</span>
                            <p className="chef-note">Brings warmth to every service with fresh preparations and seasonal menu support.</p>
                        </div>
                    </article>

                    <article className="chef-card">
                        <div className="chef-card-image-wrap">
                            <img
                                src="https://images.unsplash.com/photo-1527980965255-d3b416303d12"
                                alt="Arjun Patel, Pastry Chef"
                            />
                        </div>
                        <div className="chef-card-info">
                            <span className="chef-badge">Sweet Finish</span>
                            <span className="chef-name">Arjun Patel</span>
                            <span className="chef-role">Pastry Chef</span>
                            <p className="chef-note">Specializes in pastries, plated desserts, and the cafe's sweetest pairings.</p>
                        </div>
                    </article>
                </div>
            </section>

            {/* FEEDBACK */}
            <section className="testimonials">
                <div className="testimonials-header">
                    <h2 className="testimonials-title">What People Say About Us</h2>
                    <p className="testimonials-subtitle">Real stories from our regulars</p>
                </div>

                <div className="testimonial-grid">
                    <div className="testimonial-card">
                        <div className="testimonial-card-top">
                            <img src="https://randomuser.me/api/portraits/men/32.jpg" alt="Rahul Verma" />
                            <div className="testimonial-meta">
                                <h4>Rahul Verma</h4>
                                <span>Evening regular</span>
                            </div>
                            <p className="rating" aria-label="5 stars">
                                <span className="rating-stars">&#9733;&#9733;&#9733;&#9733;&#9733;</span>
                            </p>
                        </div>
                        <p className="testimonial-quote">
                            Amazing coffee and peaceful ambience. This is my go-to place after work.
                        </p>
                    </div>

                    <div className="testimonial-card">
                        <div className="testimonial-card-top">
                            <img src="https://randomuser.me/api/portraits/women/44.jpg" alt="Ananya Sharma" />
                            <div className="testimonial-meta">
                                <h4>Ananya Sharma</h4>
                                <span>Weekend visitor</span>
                            </div>
                            <p className="rating" aria-label="4 stars">
                                <span className="rating-stars">&#9733;&#9733;&#9733;&#9733;&#9734;</span>
                            </p>
                        </div>
                        <p className="testimonial-quote">
                            Loved the taste and friendly staff. The vibe is very calming.
                        </p>
                    </div>

                    <div className="testimonial-card">
                        <div className="testimonial-card-top">
                            <img src="https://randomuser.me/api/portraits/men/76.jpg" alt="Karthik R" />
                            <div className="testimonial-meta">
                                <h4>Karthik R</h4>
                                <span>Work meetings</span>
                            </div>
                            <p className="rating" aria-label="5 stars">
                                <span className="rating-stars">&#9733;&#9733;&#9733;&#9733;&#9733;</span>
                            </p>
                        </div>
                        <p className="testimonial-quote">
                            Perfect place for meetings and quality coffee. Highly recommended!
                        </p>
                    </div>

                    <div className="testimonial-card">
                        <div className="testimonial-card-top">
                            <img src="https://randomuser.me/api/portraits/women/65.jpg" alt="Priya Nair" />
                            <div className="testimonial-meta">
                                <h4>Priya Nair</h4>
                                <span>Remote work guest</span>
                            </div>
                            <p className="rating" aria-label="5 stars">
                                <span className="rating-stars">&#9733;&#9733;&#9733;&#9733;&#9733;</span>
                            </p>
                        </div>
                        <p className="testimonial-quote">
                            Best latte in town and such a cozy spot. I bring my laptop here every weekend.
                        </p>
                    </div>
                </div>
            </section>

            {/* Pre-footer banner */}
            <section className="pre-footer-banner" aria-hidden="true">
                <div className="pre-footer-banner-image-wrap">
                    <img
                        src="/bean-to-cup-banner.png"
                        alt=""
                        className="pre-footer-banner-img"
                    />
                    <span className="pre-footer-banner-fade" aria-hidden="true" />
                </div>
            </section>
        </>
    );
}

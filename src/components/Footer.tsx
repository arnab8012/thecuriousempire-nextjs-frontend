"use client";

import Link from "@/components/Link";
import { useLocation } from "@/utils/useLocation";
import { MdEmail, MdPhone } from "react-icons/md";

export default function Footer() {
  const { pathname } = useLocation();

  // ✅ admin panel এ footer দেখাবে না
  if (pathname.startsWith("/admin")) return null;

  return (
    <footer className="footer siteFooter">
      <div className="footerCard">
        {/* Top brand row */}
        <div className="footerBrand">
          <div className="footerLogoWrap">
            <img
              className="footerLogo"
              src="/logo.png"
              alt="The Curious Empire"
              loading="lazy"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
          </div>

          <div className="footerBrandText">
            <h3 className="footerTitle">The Curious Empire</h3>

            <p className="footerDesc">
              <span>✨ Premium Shopping Experience — Unique products delivered with quality & care.</span>
              <span>🪀আপনার বিশ্বাসই আমাদের সবচেয়ে বড় শক্তি।</span>
              <span>🪀আমরা শুধু পণ্য বিক্রি করি না—</span>
              <span>🪀আমরা তৈরি করি বিশ্বাস, গুণমান এবং সন্তুষ্টির সম্পর্ক।</span>
              <span>🦋The Curious Empire বিশ্বাস করে—ভালো পণ্য শুধু প্রয়োজন নয়, এটা একটি অভিজ্ঞতা।</span>
              <span>🛒Shop Now & Feel the Difference.</span>
              <span>🚚Fast Delivery | Trusted Service</span>
              <span>💯Quality You Can Trust🏩</span>
            </p>

            <div className="footerSocial">
              <a
                className="socBtn"
                href="https://facebook.com/TheCuriousEmpire"
                target="_blank"
                rel="noreferrer"
                aria-label="Facebook"
              >
                f
              </a>
              <a
                className="socBtn"
                href="https://www.youtube.com/@thecuriousempire"
                target="_blank"
                rel="noreferrer"
                aria-label="YouTube"
              >
                ▶
              </a>
              <a
                className="socBtn"
                href="https://instagram.com"
                target="_blank"
                rel="noreferrer"
                aria-label="Instagram"
              >
                ⌁
              </a>
              <a
                className="socBtn"
                href="https://tiktok.com"
                target="_blank"
                rel="noreferrer"
                aria-label="TikTok"
              >
                ♪
              </a>
            </div>
          </div>
        </div>

        {/* Links */}
        <div className="footerGrid">
          <div className="footerCol">
            <h4 className="footerH">Quick Links</h4>
            <Link className="footerLink" to="/shop">
              › Shop
            </Link>
            <Link className="footerLink" to="/shop?offer=1">
              › Offers
            </Link>
            <Link className="footerLink" to="/shop?sort=top">
              › Top Sales
            </Link>
            <Link className="footerLink" to="/shop">
              › All Products
            </Link>
          </div>

          <div className="footerCol">
            <h4 className="footerH">Account</h4>
            <Link className="footerLink" to="/profile">
              › My Account
            </Link>
            <Link className="footerLink" to="/favorites">
              › Priyo
            </Link>
            <Link className="footerLink" to="/cart">
              › Cart
            </Link>
            <Link className="footerLink" to="/settings">
              › Settings
            </Link>
          </div>
        </div>

        <div className="footer-contact">
          <h3>Contact Info</h3>

          <a href="mailto: thecuriousempire@gmail.com" className="contact-row">
            <MdEmail />
            <span>thecuriousempire@gmail.com</span>
          </a>

          <a href="tel:+8801799188274" className="contact-row">
            <MdPhone />
            <span>+8801799-188274</span>
          </a>
        </div>

        {/* Copyright */}
        <div className="footerBottom">
          <span>© {new Date().getFullYear()} The Curious Empire. All rights reserved.</span>
        </div>

        {/* ✅ Developer credit (এটা footerCard এর ভিতরে রাখতে হবে) */}
        <div className="footerDev">
          <img
            src="/dev.p"
            alt="Developer"
            className="footerDevImg"
            loading="lazy"
          />
          <span className="footerDevText">
            {" "}
            <a
              href=""
              target="_blank"
              rel="noreferrer"
              className="devLink"
            >
              <strong></strong>
            </a>
          </span>
        </div>
      </div>
    </footer>
  );
}
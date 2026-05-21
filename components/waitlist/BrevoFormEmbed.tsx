"use client";

import { useEffect } from "react";

export function BrevoFormEmbed() {
  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://sibforms.com/forms/end-form/build/sib-styles.css";
    link.id = "brevo-styles";
    document.head.appendChild(link);

    const script = document.createElement("script");
    script.src = "https://sibforms.com/forms/end-form/build/main.js";
    script.id = "brevo-script";
    script.defer = true;
    document.body.appendChild(script);

    return () => {
      document.getElementById("brevo-styles")?.remove();
      document.getElementById("brevo-script")?.remove();
    };
  }, []);

  return (
    <>
      <style>{`
        #sib-container {
          background-color: transparent !important;
          border: none !important;
          padding: 0 !important;
          max-width: 100% !important;
        }
        .sib-form {
          background-color: transparent !important;
          padding: 0 !important;
        }
        .sib-form-block {
          padding: 0 !important;
        }
        .input {
          font-family: 'DM Sans', sans-serif !important;
          font-size: 15px !important;
          color: #1A1A1A !important;
          border: 1.5px solid #E8E2D9 !important;
          border-radius: 10px !important;
          height: 48px !important;
          padding: 0 16px !important;
          width: 100% !important;
          box-sizing: border-box !important;
          background: #FFFFFF !important;
          margin-bottom: 12px !important;
        }
        .entry__label {
          font-family: 'DM Sans', sans-serif !important;
          font-size: 13px !important;
          font-weight: 500 !important;
          color: #6B6B6B !important;
          margin-bottom: 6px !important;
          display: block !important;
        }
        .entry__choice {
          display: flex !important;
          align-items: center !important;
          gap: 10px !important;
          border: 1px solid #E8E2D9 !important;
          border-radius: 8px !important;
          padding: 12px 14px !important;
          margin-bottom: 8px !important;
          background: #FFFFFF !important;
          cursor: pointer !important;
        }
        .entry__choice span:last-child {
          font-family: 'DM Sans', sans-serif !important;
          font-size: 14px !important;
          color: #1A1A1A !important;
        }
        .checkbox {
          display: none !important;
        }
        .sib-form-block__button {
          font-family: 'DM Sans', sans-serif !important;
          font-size: 16px !important;
          font-weight: 600 !important;
          background-color: #2C5F4A !important;
          border-radius: 26px !important;
          height: 52px !important;
          width: 100% !important;
          border: none !important;
          color: #FFFFFF !important;
          cursor: pointer !important;
          margin-top: 8px !important;
        }
        .sib-image-form-block {
          display: none !important;
        }
        .sib-form-message-panel {
          border-radius: 10px !important;
          font-family: 'DM Sans', sans-serif !important;
          margin-bottom: 16px !important;
        }
        :where(.sib-form-message-panel) {
          display: none;
        }
        :where(.sib-form-message-panel.active) {
          display: block !important;
        }
        #error-message, #success-message {
          max-width: 100% !important;
        }
        .form__label-row {
          margin-bottom: 4px !important;
        }
      `}</style>
      <div
        className="sib-form"
        dangerouslySetInnerHTML={{
          __html: `
<div id="sib-form-container" class="sib-form-container">
  <div id="error-message" class="sib-form-message-panel" style="font-size:14px;text-align:left;color:#661d1d;background-color:#ffeded;border-color:#ff4949;border-radius:10px;max-width:100%;margin-bottom:16px;">
    <div class="sib-form-message-panel__text sib-form-message-panel__text--center">
      <span class="sib-form-message-panel__inner-text">Your subscription could not be saved. Please try again.</span>
    </div>
  </div>
  <div id="success-message" class="sib-form-message-panel" style="font-size:14px;text-align:left;color:#085229;background-color:#e7faf0;border-color:#13ce66;border-radius:10px;max-width:100%;margin-bottom:16px;">
    <div class="sib-form-message-panel__text sib-form-message-panel__text--center">
      <span class="sib-form-message-panel__inner-text">You are on the list. We will be in touch.</span>
    </div>
  </div>
  <div id="sib-container" class="sib-container--large sib-container--vertical" style="max-width:100%;text-align:left;background-color:transparent;border:none;direction:ltr">
    <form id="sib-form" method="POST" action="https://13337e95.sibforms.com/serve/MUIFAII73sNbygT6lqh7pgMAzR8GPqEEiXteIXyDdNg0ORCyvtjuUPEVh60sWXdfohbElKFMyLFExFFjqsMvYxQAhZs38k99HFvZX_PENGsusQdW8ImB4LbA0uZcDPpK8Jdasz9dTi2Buq_RNhdCG1OEeOtRN9T8fV1QNVf2wUm-Lanbhxe-3nCtTc2vvLRZBTFUtFfSen3fLBwVgA==" data-type="subscription">

      <div style="padding:0 0 12px;">
        <label class="entry__label" for="FIRSTNAME">First name</label>
        <input class="input" maxlength="200" type="text" id="FIRSTNAME" name="FIRSTNAME" autocomplete="given-name" placeholder="Maria" data-required="true" required />
      </div>

      <div style="padding:0 0 12px;">
        <label class="entry__label" for="LASTNAME">Last name</label>
        <input class="input" maxlength="200" type="text" id="LASTNAME" name="LASTNAME" autocomplete="family-name" placeholder="Garcia" data-required="true" required />
      </div>

      <div style="padding:0 0 16px;">
        <label class="entry__label" for="EMAIL">Email address</label>
        <input class="input" type="email" id="EMAIL" name="EMAIL" autocomplete="email" placeholder="maria@email.com" data-required="true" required />
      </div>

      <div style="padding:0 0 16px;">
        <label class="entry__label" style="margin-bottom:10px;">Who are you caring for?</label>
        <div class="entry__choice"><label class="checkbox__label"><input type="checkbox" name="CARINGFOR[]" value="Child" data-required="true" /><span></span><span>Child</span></label></div>
        <div class="entry__choice"><label class="checkbox__label"><input type="checkbox" name="CARINGFOR[]" value="Parent" data-required="true" /><span></span><span>Parent</span></label></div>
        <div class="entry__choice"><label class="checkbox__label"><input type="checkbox" name="CARINGFOR[]" value="Spouse/Partner" data-required="true" /><span></span><span>Spouse / Partner</span></label></div>
        <div class="entry__choice"><label class="checkbox__label"><input type="checkbox" name="CARINGFOR[]" value="Professional Caregiver" data-required="true" /><span></span><span>Professional Caregiver</span></label></div>
        <div class="entry__choice"><label class="checkbox__label"><input type="checkbox" name="CARINGFOR[]" value="Other" data-required="true" /><span></span><span>Other</span></label></div>
      </div>

      <div style="padding:0 0 20px;">
        <label class="entry__label" style="margin-bottom:10px;">What feels hardest right now?</label>
        <div class="entry__choice"><label class="checkbox__label"><input type="checkbox" name="CHALLENGE[]" value="Coordinating family updates" data-required="true" /><span></span><span>Coordinating family updates</span></label></div>
        <div class="entry__choice"><label class="checkbox__label"><input type="checkbox" name="CHALLENGE[]" value="Keeping Documents Organized" data-required="true" /><span></span><span>Keeping documents organized</span></label></div>
        <div class="entry__choice"><label class="checkbox__label"><input type="checkbox" name="CHALLENGE[]" value="Managing medications" data-required="true" /><span></span><span>Managing medications</span></label></div>
        <div class="entry__choice"><label class="checkbox__label"><input type="checkbox" name="CHALLENGE[]" value="Staying prepared for emergencies" data-required="true" /><span></span><span>Staying prepared for emergencies</span></label></div>
        <div class="entry__choice"><label class="checkbox__label"><input type="checkbox" name="CHALLENGE[]" value="Tracking symptoms" data-required="true" /><span></span><span>Tracking symptoms</span></label></div>
        <div class="entry__choice"><label class="checkbox__label"><input type="checkbox" name="CHALLENGE[]" value="Understanding medical language" data-required="true" /><span></span><span>Understanding medical language</span></label></div>
      </div>

      <div style="padding:0;">
        <button class="sib-form-block__button sib-form-block__button-with-loader" form="sib-form" type="submit">
          <svg class="icon clickable__icon progress-indicator__icon sib-hide-loader-icon" viewBox="0 0 512 512">
            <path d="M460.116 373.846l-20.823-12.022c-5.541-3.199-7.54-10.159-4.663-15.874 30.137-59.886 28.343-131.652-5.386-189.946-33.641-58.394-94.896-95.833-161.827-99.676C261.028 55.961 256 50.751 256 44.352V20.309c0-6.904 5.808-12.337 12.703-11.982 83.556 4.306 160.163 50.864 202.11 123.677 42.063 72.696 44.079 162.316 6.031 236.832-3.14 6.148-10.75 8.461-16.728 5.01z" />
          </svg>
          Join the waitlist
        </button>
      </div>

      <input type="text" name="email_address_check" value="" class="input--hidden" style="display:none;" />
      <input type="hidden" name="locale" value="en" />
    </form>
  </div>
</div>
          `,
        }}
      />
    </>
  );
}

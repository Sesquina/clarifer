/**
 * components/waitlist/BrevoFormEmbed.tsx
 * Renders the Brevo-hosted waitlist form with Clarifer design overrides.
 * "use client" -- requires useEffect for external script/style injection.
 *
 * Hex strings in STYLE_OVERRIDES are intentional: these override
 * Brevo's externally-loaded stylesheet. CSS variables are not
 * resolvable in that scope (same exception as lib/pdf/).
 */
"use client";

import { useEffect } from "react";

const FORM_ACTION =
  "https://13337e95.sibforms.com/serve/MUIFAII73sNbygT6lqh7pgMAzR8GPqEEiXteIXyDdNg0ORCyvtjuUPEVh60sWXdfohbElKFMyLFExFFjqsMvYxQAhZs38k99HFvZX_PENGsusQdW8ImB4LbA0uZcDPpK8Jdasz9dTi2Buq_RNhdCG1OEeOtRN9T8fV1QNVf2wUm-Lanbhxe-3nCtTc2vvLRZBTFUtFfSen3fLBwVgA==";

const STYLE_OVERRIDES = `
  #sib-container {
    background-color: transparent !important;
    border: none !important;
    border-radius: 0 !important;
    padding: 0 !important;
    max-width: 100% !important;
  }
  .sib-form { background-color: transparent !important; }
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
  }
  .entry__label {
    font-family: 'DM Sans', sans-serif !important;
    font-size: 14px !important;
    font-weight: 500 !important;
    color: #1A1A1A !important;
  }
  .entry__choice span:last-child {
    font-family: 'DM Sans', sans-serif !important;
    font-size: 14px !important;
    color: #1A1A1A !important;
  }
  .entry__choice {
    border: 1px solid #E8E2D9 !important;
    border-radius: 8px !important;
    padding: 10px 12px !important;
    margin-bottom: 6px !important;
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
  }
  .sib-form-message-panel {
    border-radius: 10px !important;
    font-family: 'DM Sans', sans-serif !important;
  }
  .sib-image-form-block { display: none !important; }
`;

const FORM_HTML = `
<div id="sib-container" class="sib-container--large sib-container--vertical">
  <form id="sib-form" method="POST" action="${FORM_ACTION}" data-type="subscription">

    <div style="padding:8px 0;">
      <div class="sib-form-block" style="width:100%;">
        <label class="entry__label" for="FIRSTNAME">First name</label>
        <input class="input" maxlength="200" type="text" id="FIRSTNAME"
          name="FIRSTNAME" autocomplete="off" data-required="true" required />
      </div>
    </div>

    <div style="padding:8px 0;">
      <div class="sib-form-block" style="width:100%;">
        <label class="entry__label" for="LASTNAME">Last name</label>
        <input class="input" maxlength="200" type="text" id="LASTNAME"
          name="LASTNAME" autocomplete="off" data-required="true" required />
      </div>
    </div>

    <div style="padding:8px 0;">
      <div class="sib-form-block" style="width:100%;">
        <label class="entry__label" for="EMAIL">Email address</label>
        <input class="input" maxlength="200" type="email" id="EMAIL"
          name="EMAIL" autocomplete="off" data-required="true" required />
      </div>
    </div>

    <div style="padding:8px 0;">
      <div class="sib-form-block" style="width:100%;">
        <label class="entry__label">Who are you caring for?</label>
        <div class="entry__choice">
          <label><input type="checkbox" name="CARINGFOR" value="Child" /><span></span><span>Child</span></label>
        </div>
        <div class="entry__choice">
          <label><input type="checkbox" name="CARINGFOR" value="Other" /><span></span><span>Other</span></label>
        </div>
        <div class="entry__choice">
          <label><input type="checkbox" name="CARINGFOR" value="Parent" /><span></span><span>Parent</span></label>
        </div>
        <div class="entry__choice">
          <label><input type="checkbox" name="CARINGFOR" value="Professional Caregiver" /><span></span><span>Professional Caregiver</span></label>
        </div>
        <div class="entry__choice">
          <label><input type="checkbox" name="CARINGFOR" value="Spouse/Partner" /><span></span><span>Spouse/Partner</span></label>
        </div>
      </div>
    </div>

    <div style="padding:8px 0;">
      <div class="sib-form-block" style="width:100%;">
        <label class="entry__label">What is your biggest caregiving challenge?</label>
        <div class="entry__choice">
          <label><input type="checkbox" name="CHALLENGE" value="Coordinating family updates" /><span></span><span>Coordinating family updates</span></label>
        </div>
        <div class="entry__choice">
          <label><input type="checkbox" name="CHALLENGE" value="Keeping Documents Organized" /><span></span><span>Keeping Documents Organized</span></label>
        </div>
        <div class="entry__choice">
          <label><input type="checkbox" name="CHALLENGE" value="Managing medications" /><span></span><span>Managing medications</span></label>
        </div>
        <div class="entry__choice">
          <label><input type="checkbox" name="CHALLENGE" value="Staying prepared for emergencies" /><span></span><span>Staying prepared for emergencies</span></label>
        </div>
        <div class="entry__choice">
          <label><input type="checkbox" name="CHALLENGE" value="Tracking symptoms" /><span></span><span>Tracking symptoms</span></label>
        </div>
        <div class="entry__choice">
          <label><input type="checkbox" name="CHALLENGE" value="Understanding medical language" /><span></span><span>Understanding medical language</span></label>
        </div>
      </div>
    </div>

    <div style="padding:8px 0;">
      <div class="sib-form-block" style="text-align:left;">
        <button class="sib-form-block__button sib-form-block__button-with-loader"
          form="sib-form" type="submit">
          Join the waitlist
        </button>
      </div>
    </div>

    <input type="text" name="email_address_check" value="" class="input--hidden"
      style="display:none;" />
    <input type="hidden" name="locale" value="en" />

  </form>
</div>
`;

export function BrevoFormEmbed() {
  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://sibforms.com/forms/end-form/build/sib-styles.css";
    document.head.appendChild(link);

    const style = document.createElement("style");
    style.textContent = STYLE_OVERRIDES;
    document.head.appendChild(style);

    const script = document.createElement("script");
    script.src = "https://sibforms.com/forms/end-form/build/main.js";
    script.defer = true;
    document.body.appendChild(script);

    return () => {
      link.remove();
      style.remove();
      script.remove();
    };
  }, []);

  return <div dangerouslySetInnerHTML={{ __html: FORM_HTML }} />;
}

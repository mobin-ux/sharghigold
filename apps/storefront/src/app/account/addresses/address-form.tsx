'use client';

import { Alert } from '@sharghigold/ui';
import { useActionState, useState } from 'react';

import { SubmitButton } from '@/components/account/submit-button';
import { InfoIcon, PinIcon } from '@/components/icons';
import { ADDRESS_LABEL_TEXT, ADDRESS_LABELS, mobileLabel } from '@/lib/account-view';

import { saveAddress } from './actions';
import type { AddressDraftFields, AddressField, AddressState } from './state';

interface AddressFormProps {
  readonly initial: AddressDraftFields;
  /** Province to city, as the delivery table has it. */
  readonly regions: Readonly<Record<string, readonly string[]>>;
  /** The account's own number, shown when the recipient is the account holder. */
  readonly mobile: string;
  readonly editing: boolean;
}

/**
 * The one form that both adds and edits an address.
 *
 * Three things are the platform's rather than reimplemented, and each replaces
 * a `<button>` the design uses:
 *
 * - The label is a **radio group** of real inputs, so the arrow keys move
 *   between the three and «۲ از ۳» is announced.
 * - The two switches are **checkboxes**, so they are in the form payload,
 *   toggle with the space bar, and carry their own checked state.
 * - The city list is a **select** whose options follow the province, which is
 *   the only piece of state this component keeps.
 *
 * The map is drawn and inert. Picking a point needs a map service, and there
 * is none configured; a control that appeared to record a location and stored
 * nothing would send a courier to an address the customer believed they had
 * corrected.
 */
export function AddressForm({ initial, regions, mobile, editing }: AddressFormProps) {
  const [state, submit] = useActionState<AddressState, FormData>(saveAddress, {
    status: 'idle',
    draft: initial,
  });

  const draft = state.status === 'idle' ? initial : state.draft;
  const invalid = state.status === 'invalid' ? state : undefined;

  const [province, setProvince] = useState(draft.province);
  const [toSelf, setToSelf] = useState(draft.deliverToSelf);

  const cities = regions[province] ?? [];
  const provinces = Object.keys(regions);

  const helpFor = (field: AddressField, fallback: string): string =>
    invalid?.field === field ? invalid.message : fallback;

  return (
    <form className="zn-addrform" action={submit}>
      <input type="hidden" name="id" value={draft.id} />

      <section className="zn-addrform__map">
        <div className="zn-map" aria-hidden="true">
          <svg
            viewBox="0 0 360 150"
            width="100%"
            height="100%"
            preserveAspectRatio="xMidYMid slice"
          >
            <rect width="360" height="150" fill="var(--warm-100)" />
            <g stroke="var(--warm-300)" strokeWidth="1.4">
              <path d="M0 44h360M0 104h360M74 0v150M212 0v150M300 0v150" />
            </g>
            <g fill="var(--warm-200)">
              <rect x="12" y="8" width="50" height="28" rx="3" />
              <rect x="86" y="8" width="112" height="28" rx="3" />
              <rect x="224" y="56" width="62" height="38" rx="3" />
              <rect x="12" y="114" width="50" height="28" rx="3" />
              <rect x="224" y="114" width="62" height="28" rx="3" />
            </g>
            <path d="M0 74h360" stroke="var(--gold-200)" strokeWidth="9" />
          </svg>
          <span className="zn-map__pin">
            <PinIcon size={30} strokeWidth={1.8} />
          </span>
        </div>
        <p className="zn-addrform__maphelp">
          انتخاب موقعیت روی نقشه هنوز فعال نیست. نشانی را کامل بنویسید تا پیک راحت‌تر پیدا کند.
        </p>
      </section>

      <section className="zn-addrform__step" aria-labelledby="zn-addr-1">
        <h2 className="zn-addrform__head" id="zn-addr-1">
          <span className="zn-addrform__num" aria-hidden="true">
            ۱
          </span>
          نشانی محل تحویل
        </h2>

        <div className="zn-addrform__pair">
          <div className="zn-fld">
            <label className="zn-fld__label" htmlFor="zn-prov">
              استان
            </label>
            <div className="zn-fld__box zn-fld__box--select">
              <select
                className="zn-fld__select"
                id="zn-prov"
                name="province"
                value={province}
                onChange={(event) => setProvince(event.target.value)}
              >
                {provinces.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="zn-fld">
            <label className="zn-fld__label" htmlFor="zn-city">
              شهر
            </label>
            <div className="zn-fld__box zn-fld__box--select">
              <select
                className="zn-fld__select"
                id="zn-city"
                name="city"
                defaultValue={draft.city}
                key={province}
              >
                {cities.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="zn-fld">
          <label className="zn-fld__label" htmlFor="zn-addr">
            نشانی کامل
          </label>
          <div
            className={`zn-fld__box zn-fld__box--area${
              invalid?.field === 'line' ? ' zn-fld__box--bad' : ''
            }`}
          >
            <textarea
              className="zn-fld__area"
              id="zn-addr"
              name="line"
              rows={3}
              maxLength={240}
              placeholder="خیابان، کوچه، نام ساختمان"
              defaultValue={draft.line}
              aria-invalid={invalid?.field === 'line'}
              aria-describedby="zn-addr-help"
              required
            />
          </div>
          <p
            className={`zn-fld__help${invalid?.field === 'line' ? ' zn-fld__help--bad' : ''}`}
            id="zn-addr-help"
            aria-live="polite"
          >
            {helpFor('line', 'مثال: سعادت‌آباد، خیابان علامه شمالی، کوچه ۱۸')}
          </p>
        </div>

        <div className="zn-addrform__pair">
          <div className="zn-fld">
            <label className="zn-fld__label" htmlFor="zn-plate">
              پلاک
            </label>
            <div className={`zn-fld__box${invalid?.field === 'plate' ? ' zn-fld__box--bad' : ''}`}>
              <input
                className="zn-fld__input zn-fld__input--num"
                id="zn-plate"
                name="plate"
                inputMode="numeric"
                maxLength={10}
                placeholder="۱۲"
                defaultValue={draft.plate}
                aria-invalid={invalid?.field === 'plate'}
                required
              />
            </div>
          </div>

          <div className="zn-fld">
            <label className="zn-fld__label" htmlFor="zn-unit">
              واحد <span className="zn-fld__optional">(اختیاری)</span>
            </label>
            <div className="zn-fld__box">
              <input
                className="zn-fld__input zn-fld__input--num"
                id="zn-unit"
                name="unit"
                inputMode="numeric"
                maxLength={10}
                placeholder="۴"
                defaultValue={draft.unit}
              />
            </div>
          </div>
        </div>

        <div className="zn-fld">
          <label className="zn-fld__label" htmlFor="zn-postal">
            کد پستی
          </label>
          <div
            className={`zn-fld__box${invalid?.field === 'postalCode' ? ' zn-fld__box--bad' : ''}`}
          >
            <input
              className="zn-fld__input zn-fld__input--code"
              id="zn-postal"
              name="postalCode"
              inputMode="numeric"
              autoComplete="postal-code"
              dir="ltr"
              maxLength={12}
              placeholder="۱۹۹۷۸۴۵۶۱۳"
              defaultValue={draft.postalCode}
              aria-invalid={invalid?.field === 'postalCode'}
              aria-describedby="zn-postal-help"
              required
            />
          </div>
          <p
            className={`zn-fld__help${invalid?.field === 'postalCode' ? ' zn-fld__help--bad' : ''}`}
            id="zn-postal-help"
            aria-live="polite"
          >
            {helpFor('postalCode', '۱۰ رقم، بدون خط تیره')}
          </p>
        </div>
      </section>

      <section className="zn-addrform__step" aria-labelledby="zn-addr-2">
        <h2 className="zn-addrform__head" id="zn-addr-2">
          <span className="zn-addrform__num" aria-hidden="true">
            ۲
          </span>
          تحویل‌گیرنده
        </h2>

        <label className={`zn-tick${toSelf ? ' zn-tick--on' : ''}`}>
          <input
            className="zn-tick__input"
            type="checkbox"
            name="deliverToSelf"
            checked={toSelf}
            onChange={(event) => setToSelf(event.target.checked)}
          />
          <span className="zn-tick__box" aria-hidden="true" />
          <span className="zn-tick__text">تحویل‌گیرنده خودم هستم</span>
        </label>

        {toSelf ? (
          <p className="zn-addrform__self">
            <span>شماره تماس</span>
            <span className="zn-addrform__selfnum" dir="ltr">
              {mobileLabel(mobile)}
            </span>
          </p>
        ) : (
          <div className="zn-addrform__recipient">
            <div className="zn-fld">
              <label className="zn-fld__label" htmlFor="zn-rname">
                نام و نام خانوادگی تحویل‌گیرنده
              </label>
              <div
                className={`zn-fld__box${
                  invalid?.field === 'recipientName' ? ' zn-fld__box--bad' : ''
                }`}
              >
                <input
                  className="zn-fld__input"
                  id="zn-rname"
                  name="recipientName"
                  maxLength={80}
                  defaultValue={draft.recipientName}
                  aria-invalid={invalid?.field === 'recipientName'}
                  required
                />
              </div>
            </div>

            <div className="zn-fld">
              <label className="zn-fld__label" htmlFor="zn-rphone">
                شماره موبایل تحویل‌گیرنده
              </label>
              <div
                className={`zn-fld__box${
                  invalid?.field === 'recipientMobile' ? ' zn-fld__box--bad' : ''
                }`}
              >
                <input
                  className="zn-fld__input zn-fld__input--tel"
                  id="zn-rphone"
                  name="recipientMobile"
                  type="tel"
                  inputMode="numeric"
                  dir="ltr"
                  maxLength={16}
                  placeholder="۰۹۱۲ ۰۰۰ ۰۰۰۰"
                  defaultValue={draft.recipientMobile}
                  aria-invalid={invalid?.field === 'recipientMobile'}
                  aria-describedby="zn-rphone-help"
                  required
                />
              </div>
              <p
                className={`zn-fld__help${
                  invalid?.field === 'recipientMobile' ? ' zn-fld__help--bad' : ''
                }`}
                id="zn-rphone-help"
                aria-live="polite"
              >
                {helpFor('recipientMobile', 'برای هماهنگی تحویل مرسوله')}
              </p>
            </div>
          </div>
        )}
      </section>

      <section className="zn-addrform__step" aria-labelledby="zn-addr-3">
        <h2 className="zn-addrform__head" id="zn-addr-3">
          <span className="zn-addrform__num" aria-hidden="true">
            ۳
          </span>
          عنوان این آدرس
        </h2>

        <fieldset className="zn-labels">
          <legend className="sr-only">عنوان آدرس</legend>
          {ADDRESS_LABELS.map((option) => (
            <label className="zn-labels__option" key={option}>
              <input
                className="zn-labels__input"
                type="radio"
                name="label"
                value={option}
                defaultChecked={draft.label === option}
              />
              <span className="zn-labels__chip">{ADDRESS_LABEL_TEXT[option]}</span>
            </label>
          ))}
        </fieldset>

        <label className="zn-toggle">
          <span className="zn-toggle__title">آدرس پیش‌فرض من باشد</span>
          <span className="zn-toggle__note">در پرداخت، همین آدرس از ابتدا انتخاب می‌شود</span>
          <input
            className="zn-toggle__input"
            type="checkbox"
            name="isDefault"
            defaultChecked={draft.isDefault}
          />
          <span className="zn-toggle__track" aria-hidden="true">
            <span className="zn-toggle__knob" />
          </span>
        </label>
      </section>

      {invalid?.field === 'form' || invalid?.field === 'region' ? (
        <div className="zn-addrform__alert">
          <Alert variant="danger">{invalid.message}</Alert>
        </div>
      ) : null}

      <p className="zn-hint zn-addrform__privacy">
        <InfoIcon size={15} strokeWidth={1.8} />
        <span>نشانی شما فقط برای تحویل سفارش در اختیار پیک قرار می‌گیرد.</span>
      </p>

      <div className="zn-flow__foot zn-addrform__foot">
        <SubmitButton className="zn-flow__go" pendingLabel="در حال ذخیره…">
          {editing ? 'ذخیره تغییرات' : 'ثبت آدرس'}
        </SubmitButton>
      </div>
    </form>
  );
}

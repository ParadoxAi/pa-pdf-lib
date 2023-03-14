import PDFDocument from 'src/api/PDFDocument';
import PDFField, {
  FieldAppearanceOptions,
  assertFieldAppearanceOptions,
} from 'src/api/form/PDFField';

import {
  PDFRef,
  PDFAcroSignature,
  PDFWidgetAnnotation,
  PDFStream,
} from 'src/core';
import { assertIs, assertOrUndefined } from 'src/utils';
import PDFPage from '../PDFPage';
import { degrees } from '../rotations';
import {
  AppearanceProviderFor,
  defaultSignatureAppearanceProvider,
  normalizeAppearance,
} from './appearances';
import { rgb } from '../colors';
import PDFFont from '../PDFFont';

/**
 * Represents a signature field of a [[PDFForm]].
 *
 * [[PDFSignature]] fields are digital signatures. `pdf-lib` does not
 * currently provide any specialized APIs for creating digital signatures or
 * reading the contents of existing digital signatures.
 */
export default class PDFSignature extends PDFField {
  /**
   * > **NOTE:** You probably don't want to call this method directly. Instead,
   * > consider using the [[PDFForm.getSignature]] method, which will create an
   * > instance of [[PDFSignature]] for you.
   *
   * Create an instance of [[PDFSignature]] from an existing acroSignature and
   * ref
   *
   * @param acroSignature The underlying `PDFAcroSignature` for this signature.
   * @param ref The unique reference for this signature.
   * @param doc The document to which this signature will belong.
   */
  static of = (
    acroSignature: PDFAcroSignature,
    ref: PDFRef,
    doc: PDFDocument,
  ) => new PDFSignature(acroSignature, ref, doc);

  /** The low-level PDFAcroSignature wrapped by this signature. */
  readonly acroField: PDFAcroSignature;

  private constructor(
    acroSignature: PDFAcroSignature,
    ref: PDFRef,
    doc: PDFDocument,
  ) {
    super(acroSignature, ref, doc);

    assertIs(acroSignature, 'acroSignature', [
      [PDFAcroSignature, 'PDFAcroSignature'],
    ]);

    this.acroField = acroSignature;
  }

  addToPage(page: PDFPage, options?: FieldAppearanceOptions) {
    assertOrUndefined(page, 'page', [[PDFPage, 'PDFPage']]);
    assertFieldAppearanceOptions(options);

    // Create a widget for this button
    const widget = this.createWidget({
      x: (options?.x ?? 0) - (options?.borderWidth ?? 0) / 2,
      y: (options?.y ?? 0) - (options?.borderWidth ?? 0) / 2,
      width: options?.width ?? 100,
      height: options?.height ?? 50,
      textColor: options?.textColor ?? rgb(0, 0, 0),
      backgroundColor: options?.backgroundColor ?? rgb(0.75, 0.75, 0.75),
      borderColor: options?.borderColor,
      borderWidth: options?.borderWidth ?? 0,
      rotate: options?.rotate ?? degrees(0),
      hidden: options?.hidden,
      page: page.ref,
    });
    const widgetRef = this.doc.context.register(widget.dict);

    // Add widget to this field
    this.acroField.addWidget(widgetRef);

    // Set appearance streams for widget
    const font = options?.font ?? this.doc.getForm().getDefaultFont();
    this.updateWidgetAppearance(widget, font);

    // Add widget to the given page
    page.node.addAnnot(widgetRef);
  }

  private updateWidgetAppearance(
    widget: PDFWidgetAnnotation,
    font: PDFFont,
    provider?: AppearanceProviderFor<PDFSignature>,
  ) {
    const apProvider = provider ?? defaultSignatureAppearanceProvider;
    const appearances = normalizeAppearance(apProvider(this, widget, font));
    this.updateWidgetAppearanceWithFont(widget, font, appearances);
  }

  needsAppearancesUpdate(): boolean {
    if (this.isDirty()) return true;

    const widgets = this.acroField.getWidgets();
    for (let idx = 0, len = widgets.length; idx < len; idx++) {
      const widget = widgets[idx];
      const hasAppearances =
        widget.getAppearances()?.normal instanceof PDFStream;
      if (!hasAppearances) return true;
    }

    return false;
  }

  defaultUpdateAppearances(font: PDFFont) {
    assertIs(font, 'font', [[PDFFont, 'PDFFont']]);
    this.updateAppearances(font);
  }

  updateAppearances(
    font: PDFFont,
    provider?: AppearanceProviderFor<PDFSignature>,
  ) {
    assertIs(font, 'font', [[PDFFont, 'PDFFont']]);
    assertOrUndefined(provider, 'provider', [Function]);

    const widgets = this.acroField.getWidgets();
    for (let idx = 0, len = widgets.length; idx < len; idx++) {
      const widget = widgets[idx];
      this.updateWidgetAppearance(widget, font, provider);
    }
    this.markAsClean();
  }
}

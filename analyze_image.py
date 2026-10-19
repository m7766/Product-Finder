import sys
import os
from urllib.parse import quote_plus

from transformers import pipeline
from PIL import Image
import easyocr


if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")


ARABIC_LABELS = {
    "puck, hockey puck": "قرص هوكي",
    "face powder": "بودرة وجه",
    "bottlecap": "غطاء زجاجة",
    "pill bottle": "عبوة حبوب",
    "ping-pong ball": "كرة تنس الطاولة",
    "mobile phone": "هاتف محمول",
    "cellular telephone": "هاتف محمول",
    "smartphone": "هاتف ذكي",
    "lipstick": "أحمر شفاه",
    "perfume": "عطر",
    "shampoo": "شامبو",
    "toothbrush": "فرشاة أسنان",
}


STORES = [
    ("صيدليات الدواء", "al-dawaa.com"),
    ("صيدليات النهدي", "nahdionline.com"),
    ("نون السعودية", "noon.com"),
    ("أمازون السعودية", "amazon.sa"),
]


def analyze_image(image_path):

    if not os.path.isfile(image_path):
        print("الصورة غير موجودة.")
        return

    try:
        print("جاري تجهيز نموذج الذكاء الاصطناعي...")

        model = pipeline(
            "image-classification",
            model="microsoft/resnet-18"
        )

        with Image.open(image_path) as image:
            image = image.convert("RGB")
            results = model(image)

        if not results:
            print("لم يتمكن البرنامج من تحليل الصورة.")
            return

        best = results[0]
        label_en = best["label"]
        label_ar = ARABIC_LABELS.get(
            label_en.lower(),
            label_en
        )

        print("جاري قراءة اسم المنتج من الصورة...")

        reader = easyocr.Reader(
            ["ar", "en"],
            gpu=False
        )

        detected_text = reader.readtext(
            image_path,
            detail=0
        )

        ocr_text = " ".join(
            text.strip()
            for text in detected_text
            if text.strip()
        )

        if len(ocr_text) >= 3:
            search_text = ocr_text
        else:
            search_text = f"{label_ar} {label_en}"

        print("\nروابط البحث عن المنتج:")

        for store_name, domain in STORES:

            query = quote_plus(
                f"site:{domain} {search_text}"
            )

            url = (
                "https://www.google.com/search?q="
                + query
            )

            print(f"\n{store_name}:")
            print(url)

        print("\nانتهى تحليل الصورة.")

    except Exception as error:
        print(
            "حدث خطأ أثناء تحليل الصورة:",
            str(error)
        )


if __name__ == "__main__":

    if len(sys.argv) < 2:
        print(
            'طريقة الاستخدام: python analyze_image.py '
            '"اسم_الصورة.webp"'
        )
    else:
        analyze_image(sys.argv[1])
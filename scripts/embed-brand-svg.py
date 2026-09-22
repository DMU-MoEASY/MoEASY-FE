from base64 import b64encode
from pathlib import Path


ROOT = Path(__file__).resolve().parent.parent


def create_svg(png_path: Path, svg_path: Path, width: int, height: int, title: str, description: str) -> None:
    encoded = b64encode(png_path.read_bytes()).decode("ascii")
    svg = f'''<svg xmlns="http://www.w3.org/2000/svg"
     width="{width}"
     height="{height}"
     viewBox="0 0 {width} {height}"
     role="img"
     aria-labelledby="title description">
  <title id="title">{title}</title>
  <desc id="description">{description}</desc>
  <image width="{width}"
         height="{height}"
         href="data:image/png;base64,{encoded}"
         preserveAspectRatio="xMidYMid meet" />
</svg>
'''
    svg_path.write_text(svg, encoding="utf-8")


create_svg(
    ROOT / "public/brand/moeasy-logo.png",
    ROOT / "public/brand/moeasy-logo.svg",
    1688,
    540,
    "MoEasy",
    "원본 MoEasy 로고를 투명 배경으로 보존한 독립형 SVG",
)
create_svg(
    ROOT / "public/brand/moeasy-icon-512.png",
    ROOT / "public/favicon.svg",
    512,
    512,
    "MoEasy favicon",
    "MoEasy 로고의 m 부분을 그대로 사용한 독립형 투명 파비콘",
)
create_svg(
    ROOT / "src/assets/brand/extracted/moeasy-wordmark.png",
    ROOT / "src/assets/brand/extracted/moeasy-wordmark.svg",
    1688,
    540,
    "MoEasy",
    "원본 MoEasy 로고를 투명 배경으로 보존한 독립형 SVG",
)
create_svg(
    ROOT / "src/assets/brand/extracted/favicon-512.png",
    ROOT / "src/assets/brand/extracted/moeasy-favicon.svg",
    512,
    512,
    "MoEasy favicon",
    "MoEasy 로고의 m 부분을 그대로 사용한 독립형 투명 파비콘",
)

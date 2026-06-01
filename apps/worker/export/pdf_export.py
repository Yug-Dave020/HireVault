import logging
from weasyprint import HTML
import jinja2

logger = logging.getLogger(__name__)

# Base CSS styles common to all ATS-optimized single-column formats
BASE_CSS = """
@page {
    size: A4;
    margin: 18mm;
}
body {
    margin: 0;
    padding: 0;
    line-height: 1.4;
    color: #333333;
}
h1, h2, h3, h4 {
    margin-top: 0;
    margin-bottom: 0.15rem;
    font-weight: bold;
}
.header {
    text-align: center;
    margin-bottom: 1.25rem;
}
.header h1 {
    font-size: 22pt;
    margin-bottom: 0.35rem;
    text-transform: uppercase;
    letter-spacing: 0.02em;
}
.contact-info {
    font-size: 9.5pt;
    color: #555555;
    margin-bottom: 0.25rem;
}
.contact-info span {
    margin: 0 4px;
}
.section {
    margin-bottom: 1rem;
}
.section-title {
    font-size: 11.5pt;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    border-bottom: 1.5px solid var(--accent);
    padding-bottom: 2px;
    margin-bottom: 0.5rem; /* 🎨 Fixed: Added space below the line */
}
.item {
    margin-bottom: 0.6rem;
}
/* 🎨 Fixed: Replaced fragile Flexbox layouts with robust tables for precise PDF alignment */
.item-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 0.1rem;
}
.item-table td {
    padding: 0;
    vertical-align: top;
}
.item-title {
    font-size: 10.5pt;
    font-weight: bold;
    color: #111111;
    text-align: left;
}
.item-date {
    font-size: 9.5pt;
    color: #555555;
    text-align: right;
    width: 120px;
}
.item-subtitle {
    font-size: 9.5pt;
    font-style: italic;
    color: #444444;
    margin-bottom: 0.2rem;
}
.bullets {
    margin-top: 0.15rem;
    margin-bottom: 0;
    padding-left: 1.1rem;
    font-size: 9.5pt;
    color: #444444;
}
.bullets li {
    margin-bottom: 0.15rem;
    text-align: justify;
}
.skills-grid {
    font-size: 9.5pt;
    color: #444444;
    line-height: 1.4;
}
.skills-group {
    margin-bottom: 0.3rem;
}
.skills-label {
    font-weight: bold;
    color: #111111;
}
.summary-text {
    font-size: 9.5pt;
    color: #444444;
    text-align: justify;
    line-height: 1.45;
}
"""

THEME_CONFIGS = {
    "classic_executive": {
        "font_heading": "Georgia, serif",
        "font_body": "'Times New Roman', Times, serif",
        "accent_color": "#2c3e50",
        "extra_css": ""
    },
    "modern_minimalist": {
        "font_heading": "'Helvetica Neue', Arial, sans-serif",
        "font_body": "'Helvetica Neue', Arial, sans-serif",
        "accent_color": "#1d9e75",
        "extra_css": """
        .section-title {
            font-weight: 700;
        }
        """
    },
    "tech_professional": {
        "font_heading": "Arial, sans-serif",
        "font_body": "Arial, sans-serif",
        "accent_color": "#3b82f6",
        "extra_css": """
        .item-date, .contact-info, .skills-label {
            font-family: 'Courier New', Courier, monospace;
            font-size: 9pt;
        }
        """
    }
}

HTML_TEMPLATE = """<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>{{ personal.full_name or 'Resume' }}</title>
    <style>
        :root {
            --accent: {{ design_prefs.accent_color or '#1d9e75' }};
        }
        body {
            font-family: {{ font_body }};
        }
        h1, h2, h3, h4, .section-title {
            font-family: {{ font_heading }};
        }
        {{ base_css }}
        {{ extra_css }}
    </style>
</head>
<body>

    <!-- Header Section -->
    <div class="header">
        <h1>{{ personal.full_name or '' }}</h1>
        <div class="contact-info">
            {% if personal.email %}<span>{{ personal.email }}</span>{% endif %}
            {% if personal.phone %}<span> | {{ personal.phone }}</span>{% endif %}
            {% if personal.location %}<span> | {{ personal.location }}</span>{% endif %}
        </div>
        <div class="contact-info">
            {% if personal.linkedin_url %}<span><a href="{{ personal.linkedin_url }}">{{ personal.linkedin_url }}</a></span>{% endif %}
            {% if personal.website_url %}<span> | <a href="{{ personal.website_url }}">{{ personal.website_url }}</a></span>{% endif %}
        </div>
    </div>

    <!-- Summary Section -->
    {% if personal.summary %}
    <div class="section">
        <div class="section-title">Professional Summary</div>
        <div class="summary-text">{{ personal.summary }}</div>
    </div>
    {% endif %}

    <!-- Work Experience Section -->
    {% if experience %}
    <div class="section">
        <div class="section-title">Work Experience</div>
        {% for job in experience %}
        <div class="item">
            <table class="item-table">
                <tr>
                    <td class="item-title">{{ job.title }}</td>
                    <td class="item-date">{{ job.start_date }} – {{ job.end_date or ('Present' if job.is_current else '') }}</td>
                </tr>
            </table>
            <div class="item-subtitle">{{ job.company }}{% if job.location %}, {{ job.location }}{% endif %}</div>
            {% if job.bullets %}
            <ul class="bullets">
                {% for bullet in job.bullets %}
                <li>{{ bullet }}</li>
                {% endfor %}
            </ul>
            {% endif %}
        </div>
        {% endfor %}
    </div>
    {% endif %}

    <!-- Education Section -->
    {% if education %}
    <div class="section">
        <div class="section-title">Education</div>
        {% for edu in education %}
        <div class="item">
            <table class="item-table">
                <tr>
                    <td class="item-title">{{ edu.institution }}</td>
                    <td class="item-date">{{ edu.start_year }} – {{ edu.end_year or 'Present' }}</td>
                </tr>
            </table>
            <div class="item-subtitle">{{ edu.degree }}{% if edu.field %} in {{ edu.field }}{% endif %}{% if edu.gpa %} (GPA: {{ edu.gpa }}){% endif %}</div>
        </div>
        {% endfor %}
    </div>
    {% endif %}

    <!-- Projects Section -->
    {% if projects %}
    <div class="section">
        <div class="section-title">Projects</div>
        {% for project in projects %}
        <div class="item">
            <table class="item-table">
                <tr>
                    <td class="item-title">{{ project.name }}</td>
                    <td class="item-date">{% if project.url %}<a href="{{ project.url }}">Link</a>{% endif %}</td>
                </tr>
            </table>
            {% if project.description %}
            <div class="summary-text" style="margin-bottom: 0.2rem;">{{ project.description }}</div>
            {% endif %}
            {% if project.tech_stack %}
            <div class="skills-grid" style="font-style: italic;">
                <span class="skills-label">Technologies:</span> {{ project.tech_stack | join(', ') }}
            </div>
            {% endif %}
        </div>
        {% endfor %}
    </div>
    {% endif %}

    <!-- Skills & Languages Section -->
    {% if skills.technical or skills.soft or skills.languages %}
    <div class="section">
        <div class="section-title">Skills & Languages</div>
        <div class="skills-grid">
            {% if skills.technical %}
            <div class="skills-group">
                <span class="skills-label">Technical Skills:</span> {{ skills.technical | join(', ') }}
            </div>
            {% endif %}
            {% if skills.soft %}
            <div class="skills-group">
                <span class="skills-label">Soft Skills:</span> {{ skills.soft | join(', ') }}
            </div>
            {% endif %}
            {% if skills.languages %}
            <div class="skills-group">
                <span class="skills-label">Languages:</span>
                {% for lang in skills.languages %}
                {{ lang.name }} ({{ lang.level }}){% if not loop.last %}, {% endif %}
                {% endfor %}
            </div>
            {% endif %}
        </div>
    </div>
    {% endif %}

</body>
</html>
"""

def render_cv_html(profile: dict, design_prefs: dict) -> str:
    theme = design_prefs.get("theme", "modern_minimalist")
    theme_conf = THEME_CONFIGS.get(theme, THEME_CONFIGS["modern_minimalist"])
    
    font_heading = design_prefs.get("font_heading") or theme_conf["font_heading"]
    font_body = design_prefs.get("font_body") or theme_conf["font_body"]
    accent_color = design_prefs.get("accent_color") or theme_conf["accent_color"]
    
    extra_css = theme_conf["extra_css"]
    
    template = jinja2.Template(HTML_TEMPLATE)
    html_out = template.render(
        personal=profile.get("personal", {}),
        experience=profile.get("experience", []),
        education=profile.get("education", []),
        projects=profile.get("projects", []),
        skills=profile.get("skills", {"technical": [], "soft": [], "languages": []}),
        design_prefs={
            "theme": theme,
            "accent_color": accent_color
        },
        font_heading=font_heading,
        font_body=font_body,
        base_css=BASE_CSS,
        extra_css=extra_css
    )
    return html_out

async def export_pdf(cv_content: dict, design_prefs: dict = None) -> bytes:
    if design_prefs is None:
        design_prefs = cv_content.get("design_prefs", {})
        
    logger.info(f"Exporting PDF using theme: {design_prefs.get('theme', 'modern_minimalist')}")
    html_string = render_cv_html(cv_content, design_prefs)
    
    pdf_bytes = HTML(string=html_string).write_pdf()
    logger.info("PDF bytes rendered successfully via WeasyPrint.")
    return pdf_bytes
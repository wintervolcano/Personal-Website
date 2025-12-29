from manim import *
import numpy as np


class SearchModeExplainer(Scene):
    """
    Explainer for the Search Mode feature on fazalkareem.com.

    Sections:
      1. Introduction: what Search Mode is.
      2. Time series from a radio telescope.
      3. FFT intuition (time vs frequency view).
      4. Pulsar search: how repeating pulses make a peak.
      5. A mock view of the website with the Search Mode overlay.
      6. How this matches the interactive demo.
    """

    def construct(self) -> None:
        self.intro_section()
        self.search_mode_overview()
        self.time_series_section()
        self.fft_intuition_section()
        self.pulsar_search_section()
        self.website_overlay_section()
        self.outro_section()

    # Basic helper for title cards
    def title_card(self, title: str, subtitle: str | None = None):
        title_text = Text(title, font_size=56, weight=MEDIUM)
        if subtitle:
            subtitle_text = Text(subtitle, font_size=28).next_to(title_text, DOWN, buff=0.4)
            group = VGroup(title_text, subtitle_text)
        else:
            group = VGroup(title_text)

        self.play(FadeIn(group, shift=UP, run_time=1.0))
        self.wait(1.5)
        self.play(FadeOut(group, shift=UP, run_time=0.8))

    # --- Sections ---------------------------------------------------------------

    def intro_section(self):
        self.title_card("Search Mode", "A gentle introduction to pulsar hunting")

        line1 = Text("Search Mode is a mini pulsar search lab", font_size=34)
        line2 = Text("running in your browser.", font_size=34)
        line2.next_to(line1, DOWN, buff=0.3)

        group = VGroup(line1, line2).move_to(ORIGIN)
        self.play(Write(line1))
        self.play(Write(line2))
        self.wait(2)
        self.play(FadeOut(group, run_time=0.8))

    def search_mode_overview(self):
        title = Text("What is Search Mode?", font_size=46, weight=MEDIUM).to_edge(UP, buff=0.7)
        self.play(FadeIn(title, shift=DOWN))

        bullets = VGroup(
            Text("Interactive demo of how astronomers search for pulsars.", font_size=30),
            Text("You move your cursor to \"scan\" a synthetic chunk of sky.", font_size=30),
            Text("The site generates a fake radio signal and its FFT in real time.", font_size=30),
            Text("Your task: spot the repeating pattern that reveals a pulsar.", font_size=30),
        )
        bullets.arrange(DOWN, aligned_edge=LEFT, buff=0.4).to_edge(LEFT, buff=1.0).shift(DOWN * 0.3)

        for b in bullets:
            self.play(FadeIn(b, shift=RIGHT, run_time=0.7))
            self.wait(0.3)

        self.wait(2)
        self.play(FadeOut(VGroup(title, bullets), run_time=0.8))

    def time_series_section(self):
        title = Text("Step 1: Time series", font_size=46, weight=MEDIUM).to_edge(UP, buff=0.7)
        self.play(FadeIn(title, shift=DOWN))

        axes = Axes(
            x_range=[0, 10, 1],
            y_range=[-1.5, 1.5, 1],
            x_length=10,
            y_length=3,
        ).to_edge(DOWN, buff=1.0)
        x_label = Text("Time", font_size=26).next_to(axes, DOWN, buff=0.4)
        y_label = Text("Signal strength", font_size=26).next_to(axes, LEFT, buff=0.7)

        self.play(Create(axes), FadeIn(x_label), FadeIn(y_label))

        base_curve = axes.plot(lambda x: 0.15 * np.sin(0.8 * x), x_range=[0, 10], color=GREY)
        noisy_curve = axes.plot(
            lambda x: 0.15 * np.sin(0.8 * x) + 0.6 * np.sin(2.6 * x),
            x_range=[0, 10],
            color=YELLOW,
        )

        caption1 = Text("A radio telescope measures signal strength over time.", font_size=30).to_edge(LEFT, buff=1.0)
        caption2 = Text("Most of it looks like messy noise.", font_size=30).next_to(caption1, DOWN, buff=0.3)
        caption3 = Text("Hidden inside, some patterns repeat over and over.", font_size=30).next_to(caption2, DOWN, buff=0.3)

        self.play(Create(base_curve))
        self.play(FadeIn(caption1, shift=RIGHT))
        self.play(FadeIn(caption2, shift=RIGHT))
        self.wait(1)
        self.play(Transform(base_curve, noisy_curve))
        self.play(FadeIn(caption3, shift=RIGHT))
        self.wait(2.5)

        self.play(
            FadeOut(VGroup(title, axes, x_label, y_label, base_curve, caption1, caption2, caption3)),
            run_time=1.0,
        )

    def fft_intuition_section(self):
        title = Text("Step 2: FFT – a frequency view", font_size=44, weight=MEDIUM).to_edge(UP, buff=0.7)
        self.play(FadeIn(title, shift=DOWN))

        time_axes = Axes(
            x_range=[0, 10, 1],
            y_range=[-1.5, 1.5, 1],
            x_length=5,
            y_length=3,
        ).to_edge(LEFT, buff=0.8).shift(DOWN * 0.5)
        freq_axes = Axes(
            x_range=[0, 10, 1],
            y_range=[0, 1.2, 0.2],
            x_length=5,
            y_length=3,
        ).to_edge(RIGHT, buff=0.8).shift(DOWN * 0.5)

        time_label = Text("Time domain", font_size=26).next_to(time_axes, UP, buff=0.3)
        freq_label = Text("Frequency domain", font_size=26).next_to(freq_axes, UP, buff=0.3)

        self.play(Create(time_axes), Create(freq_axes))
        self.play(FadeIn(time_label), FadeIn(freq_label))

        time_curve = time_axes.plot(
            lambda x: 0.6 * np.sin(2.6 * x) + 0.3 * np.sin(5.2 * x),
            x_range=[0, 10],
            color=YELLOW,
        )
        self.play(Create(time_curve))

        freq_bars = VGroup()
        freqs = [2.6, 5.2]
        amps = [1.0, 0.7]
        for f, a in zip(freqs, amps):
            bar = freq_axes.get_vertical_line(
                freq_axes.c2p(f, a),
                color=BLUE,
                stroke_width=10,
            )
            freq_bars.add(bar)

        bullet1 = Text("FFT = Fast Fourier Transform.", font_size=30).to_edge(DOWN, buff=1.0)
        bullet2 = Text("It rewrites the wiggly time series as a mix of tones.", font_size=30).next_to(
            bullet1, UP, buff=0.3
        )
        bullet3 = Text("A sharp peak means “there is a strong repeating pattern here”.", font_size=30).next_to(
            bullet2, UP, buff=0.3
        )

        self.play(FadeIn(bullet1, shift=UP))
        self.play(FadeIn(bullet2, shift=UP))
        self.wait(1.0)
        self.play(Create(freq_bars))
        self.play(FadeIn(bullet3, shift=UP))
        self.wait(2.5)

        self.play(
            FadeOut(
                VGroup(
                    title,
                    time_axes,
                    freq_axes,
                    time_label,
                    freq_label,
                    time_curve,
                    freq_bars,
                    bullet1,
                    bullet2,
                    bullet3,
                )
            ),
            run_time=1.0,
        )

    def pulsar_search_section(self):
        title = Text("Step 3: Pulsar search", font_size=46, weight=MEDIUM).to_edge(UP, buff=0.7)
        self.play(FadeIn(title, shift=DOWN))

        pulsar_circle = Circle(radius=0.7, color=YELLOW).set_fill(YELLOW, opacity=0.5)
        pulsar_beam1 = Rectangle(width=0.15, height=2.2, color=YELLOW).set_fill(YELLOW, opacity=0.8)
        pulsar_beam2 = pulsar_beam1.copy()
        pulsar_beam1.next_to(pulsar_circle, UP, buff=-0.1)
        pulsar_beam2.next_to(pulsar_circle, DOWN, buff=-0.1)
        pulsar = VGroup(pulsar_circle, pulsar_beam1, pulsar_beam2).move_to(LEFT * 4 + UP * 0.3)

        dish = Arc(radius=0.9, angle=PI, start_angle=-PI / 2).set_stroke(WHITE, width=4)
        stand = Line(ORIGIN, DOWN * 1.0).set_stroke(WHITE, width=4)
        telescope = VGroup(dish, stand).move_to(LEFT * 1.5 + DOWN * 1.2)

        self.play(FadeIn(pulsar, shift=RIGHT), FadeIn(telescope, shift=UP), run_time=1.2)

        beams = VGroup()
        for _ in range(4):
            ray = Line(pulsar.get_right(), telescope.get_top() + RIGHT * 0.1, color=YELLOW, stroke_width=2)
            beams.add(ray)
        self.play(LaggedStart(*[Create(ray) for ray in beams], lag_ratio=0.15, run_time=1.2))
        self.wait(0.8)

        freq_axes = Axes(
            x_range=[0, 10, 1],
            y_range=[0, 1.2, 0.2],
            x_length=6,
            y_length=3,
        ).to_edge(RIGHT, buff=1.0)
        self.play(Create(freq_axes))

        peak = freq_axes.get_vertical_line(freq_axes.c2p(3.0, 1.0), color=YELLOW, stroke_width=12)
        decoy1 = freq_axes.get_vertical_line(freq_axes.c2p(1.8, 0.3), color=GREY, stroke_width=8)
        decoy2 = freq_axes.get_vertical_line(freq_axes.c2p(5.4, 0.4), color=GREY, stroke_width=8)
        self.play(Create(peak), Create(decoy1), Create(decoy2))

        caption1 = Text("A pulsar is a rapidly rotating neutron star.", font_size=30).to_edge(DOWN, buff=1.0)
        caption2 = Text("Each rotation sends a radio pulse past Earth.", font_size=30).next_to(
            caption1, UP, buff=0.3
        )
        caption3 = Text(
            "In the FFT, that repetition shows up as a sharp peak at its spin frequency.",
            font_size=30,
        ).next_to(caption2, UP, buff=0.3)

        self.play(FadeIn(caption1, shift=UP))
        self.play(FadeIn(caption2, shift=UP))
        self.play(FadeIn(caption3, shift=UP))
        self.wait(2.5)

        self.play(
            FadeOut(VGroup(title, pulsar, telescope, beams, freq_axes, peak, decoy1, decoy2, caption1, caption2, caption3)),
            run_time=1.0,
        )

    def website_overlay_section(self):
        """
        Sketch of the actual Search Mode page:
        - Browser chrome
        - Main content area
        - Dark Search Mode overlay with time‑series + FFT panels
        - Mouse / cursor showing the interaction loop
        """
        title = Text("How the page looks", font_size=44, weight=MEDIUM).to_edge(UP, buff=0.7)
        self.play(FadeIn(title, shift=DOWN))

        # Browser frame
        browser = RoundedRectangle(corner_radius=0.25, width=11.5, height=6.5, color=GREY_B).shift(DOWN * 0.3)
        tab_bar = Rectangle(width=browser.width, height=0.5, color=GREY_B, fill_color=GREY_E, fill_opacity=0.8)
        tab_bar.move_to(browser.get_top() + DOWN * 0.25)

        dot_r = 0.06
        traffic = VGroup(
            Circle(radius=dot_r, color=RED, fill_opacity=1).move_to(tab_bar.get_left() + RIGHT * 0.3),
            Circle(radius=dot_r, color=YELLOW, fill_opacity=1).next_to(_, RIGHT, buff=0.15) if False else Circle(
                radius=dot_r, color=YELLOW, fill_opacity=1
            ),
        )
        # Build traffic lights properly to avoid the underscore hack above
        red = Circle(radius=dot_r, color=RED, fill_opacity=1)
        yellow = Circle(radius=dot_r, color=YELLOW, fill_opacity=1)
        green = Circle(radius=dot_r, color=GREEN, fill_opacity=1)
        red.move_to(tab_bar.get_left() + RIGHT * 0.3)
        yellow.next_to(red, RIGHT, buff=0.15)
        green.next_to(yellow, RIGHT, buff=0.15)
        traffic = VGroup(red, yellow, green)

        url_bar = RoundedRectangle(
            corner_radius=0.15, width=4.5, height=0.3, color=GREY_C, fill_color=WHITE, fill_opacity=0.15
        ).next_to(traffic, RIGHT, buff=0.5)
        url_text = Text("fazalkareem.com / Search Mode", font_size=18).move_to(url_bar.get_center())

        # Main layout: left content + right sidebar card (roughly like the site)
        content_area = Rectangle(
            width=browser.width - 0.8, height=browser.height - 1.2, color=GREY_B
        ).align_to(browser, DOWN).shift(UP * 0.2)

        left_column = Rectangle(
            width=content_area.width * 0.55, height=content_area.height * 0.9, color=GREY_D,
            fill_color=GREY_E, fill_opacity=0.2
        ).align_to(content_area, LEFT).shift(RIGHT * 0.1, UP * 0.05)

        right_column = Rectangle(
            width=content_area.width * 0.35, height=content_area.height * 0.9, color=GREY_D,
            fill_color=GREY_E, fill_opacity=0.1
        ).align_to(content_area, RIGHT).shift(LEFT * 0.1, UP * 0.05)

        # Search Mode overlay (bottom, spanning width)
        overlay = RoundedRectangle(
            corner_radius=0.2,
            width=content_area.width * 0.92,
            height=content_area.height * 0.4,
            color=GREY_C,
            fill_color=BLACK,
            fill_opacity=0.9,
        ).align_to(content_area, DOWN).shift(UP * 0.2)

        overlay_title = Text("Search Mode", font_size=26, weight=MEDIUM, color=WHITE).next_to(
            overlay.get_top(), DOWN, buff=0.15
        ).align_to(overlay, LEFT).shift(RIGHT * 0.3)

        # Inside overlay: time‑series and FFT panels
        ts_panel = Rectangle(
            width=overlay.width * 0.44,
            height=overlay.height * 0.5,
            color=GREY_D,
        ).align_to(overlay, LEFT).shift(RIGHT * 0.3, DOWN * 0.2)
        fft_panel = Rectangle(
            width=overlay.width * 0.44,
            height=overlay.height * 0.5,
            color=GREY_D,
        ).align_to(overlay, RIGHT).shift(LEFT * 0.3, DOWN * 0.2)

        ts_label = Text("Time series", font_size=20, color=GREY_B).next_to(ts_panel, UP, buff=0.1)
        fft_label = Text("FFT spectrum", font_size=20, color=GREY_B).next_to(fft_panel, UP, buff=0.1)

        # Simple waveform + peak inside the panels
        ts_axes = NumberPlane(
            x_range=[0, 10, 1], y_range=[-1, 1, 1],
            x_length=ts_panel.width * 0.9, y_length=ts_panel.height * 0.7,
            axis_config={"stroke_color": GREY_D, "stroke_width": 1},
        ).move_to(ts_panel.get_center())
        ts_wave = ts_axes.plot(lambda x: 0.5 * np.sin(2 * x) + 0.2 * np.sin(5 * x), x_range=[0, 10], color=YELLOW)

        fft_axes = NumberPlane(
            x_range=[0, 10, 1], y_range=[0, 1.2, 0.2],
            x_length=fft_panel.width * 0.9, y_length=fft_panel.height * 0.7,
            axis_config={"stroke_color": GREY_D, "stroke_width": 1},
        ).move_to(fft_panel.get_center())
        peak_line = fft_axes.get_vertical_line(fft_axes.c2p(3, 1.0), color=YELLOW, stroke_width=8)
        decoy_line = fft_axes.get_vertical_line(fft_axes.c2p(6, 0.4), color=GREY_B, stroke_width=6)

        # Cursor showing interaction
        cursor = Triangle(color=WHITE, fill_opacity=1).scale(0.2)
        cursor.rotate(-PI / 6)
        cursor.move_to(overlay.get_left() + RIGHT * 0.6 + UP * 0.4)

        self.play(FadeIn(browser), FadeIn(tab_bar))
        self.play(FadeIn(traffic), FadeIn(url_bar), FadeIn(url_text), run_time=0.8)
        self.play(FadeIn(content_area), FadeIn(left_column), FadeIn(right_column), run_time=0.8)
        self.play(FadeIn(overlay), FadeIn(overlay_title), run_time=0.8)
        self.play(FadeIn(ts_panel), FadeIn(fft_panel), FadeIn(ts_label), FadeIn(fft_label), run_time=0.8)
        self.play(Create(ts_axes), Create(ts_wave), Create(fft_axes), Create(peak_line), Create(decoy_line), run_time=1.2)
        self.play(FadeIn(cursor), run_time=0.5)

        # Narrated interaction: move cursor, "capture", then click FFT peak
        step1 = Text("1. Toggle Search Mode (dark demo panel).", font_size=26).to_edge(DOWN, buff=0.9)
        step2 = Text("2. Move the cursor: the time series + FFT update live.", font_size=26).next_to(
            step1, UP, buff=0.3
        )
        step3 = Text("3. Capture the signal, then click the true FFT peak.", font_size=26).next_to(
            step2, UP, buff=0.3
        )

        self.play(FadeIn(step1, shift=UP))
        self.play(FadeIn(step2, shift=UP))

        # Cursor motion across overlay
        self.play(cursor.animate.move_to(overlay.get_center() + LEFT * 1.5 + UP * 0.1), run_time=1.2)
        self.play(cursor.animate.move_to(overlay.get_center() + RIGHT * 1.0 + DOWN * 0.3), run_time=1.2)

        self.play(FadeIn(step3, shift=UP))
        # "Click" the FFT peak
        click_circle = Circle(radius=0.15, color=YELLOW).move_to(peak_line.get_top())
        self.play(Indicate(peak_line, scale_factor=1.2, color=YELLOW), FadeIn(click_circle, run_time=0.4))
        self.wait(2.0)

        self.play(
            FadeOut(
                VGroup(
                    title,
                    browser,
                    tab_bar,
                    traffic,
                    url_bar,
                    url_text,
                    content_area,
                    left_column,
                    right_column,
                    overlay,
                    overlay_title,
                    ts_panel,
                    fft_panel,
                    ts_label,
                    fft_label,
                    ts_axes,
                    ts_wave,
                    fft_axes,
                    peak_line,
                    decoy_line,
                    cursor,
                    step1,
                    step2,
                    step3,
                    click_circle,
                )
            ),
            run_time=1.0,
        )

    def outro_section(self):
        title = Text("How this matches Search Mode", font_size=44, weight=MEDIUM).to_edge(UP, buff=0.7)
        self.play(FadeIn(title, shift=DOWN))

        bullets = VGroup(
            Text("On the site, Search Mode builds a synthetic time series as you move the mouse.", font_size=30),
            Text("It runs an FFT in the browser and plots the spectrum in real time.", font_size=30),
            Text("You hunt for the real peak among decoys, like an astronomer scanning survey data.", font_size=30),
            Text("By playing, you learn what pulsar searches feel like in practice.", font_size=30),
        )
        bullets.arrange(DOWN, aligned_edge=LEFT, buff=0.4).to_edge(LEFT, buff=1.0).shift(DOWN * 0.2)

        for b in bullets:
            self.play(FadeIn(b, shift=RIGHT, run_time=0.7))
            self.wait(0.3)

        self.wait(2.5)

        end_title = Text("Thanks for exploring Search Mode", font_size=42, weight=MEDIUM)
        end_sub = Text("Now try finding a pulsar yourself.", font_size=32)
        end_group = VGroup(end_title, end_sub).arrange(DOWN, buff=0.4).move_to(ORIGIN)

        self.play(FadeOut(VGroup(title, bullets), run_time=0.8))
        self.play(FadeIn(end_group, shift=UP, run_time=1.0))
        self.wait(2.5)

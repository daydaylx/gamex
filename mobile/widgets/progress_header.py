"""
Progress Header Widget

Shows question progress with counter and progress bar.
"""
from kivy.uix.boxlayout import BoxLayout
from kivy.uix.label import Label
from kivy.uix.progressbar import ProgressBar
from kivy.properties import NumericProperty, StringProperty


class ProgressHeader(BoxLayout):
    """
    Progress header showing current step and progress bar.

    Properties:
        current: Current question number (1-indexed)
        total: Total number of questions
        module_name: Current module name
    """

    current = NumericProperty(0)
    total = NumericProperty(0)
    module_name = StringProperty('')

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.orientation = 'vertical'
        self.size_hint_y = None
        self.height = 80
        self.spacing = 5
        self.padding = [10, 10, 10, 5]

        # Module name label
        self.module_label = Label(
            text='',
            font_size='14sp',
            color=(0.5, 0.5, 0.5, 1),
            size_hint_y=None,
            height=20,
        )
        self.add_widget(self.module_label)

        # Progress text
        self.progress_label = Label(
            text='',
            font_size='16sp',
            bold=True,
            size_hint_y=None,
            height=25,
        )
        self.add_widget(self.progress_label)

        # Progress bar
        self.progress_bar = ProgressBar(
            max=100,
            value=0,
            size_hint_y=None,
            height=8,
        )
        self.add_widget(self.progress_bar)

        # Bind to update
        self.bind(current=self._update_display)
        self.bind(total=self._update_display)
        self.bind(module_name=self._update_module)

    def _update_display(self, *args):
        """Update progress display."""
        if self.total > 0:
            self.progress_label.text = f'Frage {self.current} von {self.total}'
            progress_pct = (self.current / self.total) * 100
            self.progress_bar.value = progress_pct
        else:
            self.progress_label.text = ''
            self.progress_bar.value = 0

    def _update_module(self, *args):
        """Update module name display."""
        if self.module_name:
            self.module_label.text = f'📁 {self.module_name}'
        else:
            self.module_label.text = ''

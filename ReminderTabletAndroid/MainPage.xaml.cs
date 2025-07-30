using ReminderTabletAndroid.Components.Pages;
using Microsoft.AspNetCore.Components.WebView.Maui;

namespace ReminderTabletAndroid;

public partial class MainPage : ContentPage
{
    public MainPage()
    {
        InitializeComponent();
        
        blazorWebView.RootComponents.Add(new RootComponent
        {
            Selector = "#app",
            ComponentType = typeof(Home)
        });
    }
}
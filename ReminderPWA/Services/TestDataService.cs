using ReminderTabletNew2.Models;

namespace ReminderTabletNew2.Services
{
    public static class TestDataService
    {
        public static List<DailyTask> GetDefaultTasks()
        {
            return new List<DailyTask>
            {
                new DailyTask 
                { 
                    Type = "RUOKA", 
                    Description = "Lounas tai ainakin kunnon välipala", 
                    RequiresAck = true, 
                    IsAckedToday = false 
                },
                new DailyTask 
                { 
                    Type = "LÄÄKKEET", 
                    Description = "Muista ottaa päivän lääkkeet", 
                    RequiresAck = true, 
                    IsAckedToday = false 
                },
                new DailyTask 
                { 
                    Type = "PUUHAA", 
                    Description = "Kävely meren rannalla, teatteri-iltapäivä tai aamun lehden lukemista", 
                    RequiresAck = false, 
                    IsAckedToday = false 
                }
            };
        }

        public static Weather GetDefaultWeather()
        {
            return new Weather
            {
                Description = "Pilvistä",
                Temperature = "12°C"
            };
        }

        /// <summary>
        /// DYNAAMINEN KUVA-JÄRJESTELMÄ
        /// 
        /// IDEA: Backend (ReminderApp.js) laskee viikon/kuukauden numero
        /// ja palauttaa oikean kuvan URL:n DailyPhotoUrl kentässä.
        /// 
        /// KUVIEN TALLENNUSPAIKAT:
        /// - OneDrive public links (toimii paremmin kuin Google Drive)
        /// - Dropbox public links  
        /// - GitHub repository
        /// - Azure Blob Storage
        /// </summary>
        
        public static string GetDefaultPhotoUrl()
        {
            // Fallback kuva jos API ei palauta valokuvaa
            // Käytetään yksinkertaista data URL:a joka toimii aina
            return "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjBmMGYwIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxOCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPvCfk7ggUMOkaXbDpG4ga3V2YW11aXN0bzwvdGV4dD48L3N2Zz4=";
        }
        
        public static int GetCurrentWeekNumber()
        {
            var currentDate = DateTime.Now;
            var jan1 = new DateTime(currentDate.Year, 1, 1);
            var daysOffset = DayOfWeek.Thursday - jan1.DayOfWeek;
            
            var firstThursday = jan1.AddDays(daysOffset);
            var cal = System.Globalization.CultureInfo.CurrentCulture.Calendar;
            var firstWeek = cal.GetWeekOfYear(firstThursday, System.Globalization.CalendarWeekRule.FirstFourDayWeek, DayOfWeek.Monday);
            
            var weekNum = cal.GetWeekOfYear(currentDate, System.Globalization.CalendarWeekRule.FirstFourDayWeek, DayOfWeek.Monday);
            if (weekNum >= 52 && currentDate.Month == 1)
            {
                weekNum = 1;
            }
            
            return weekNum;
        }
        
        /// <summary>
        /// BACKEND INTEGRAATIO TULOSSA
        /// ReminderApp.js tulee palauttamaan oikean viikottaisen kuvan URL:n
        /// </summary>
        public static string GetWeeklyPhotoCaption()
        {
            var weekNumber = GetCurrentWeekNumber();
            return $"Viikon {weekNumber} perhekuva 💕";
        }

        public static string GetDefaultPhotoCaption()
        {
            // Fallback kuvateksti jos API ei palauta sitä
            var captions = new[] {
                "Päivän kaunis muisto 💕",
                "Hyvää päivää! 🌞",
                "Muistoja menneisyydestä 📸",
                "Kaunis päivä alkaa! ✨"
            };
            // Valitse päivän mukaan sama caption
            var dayOfYear = DateTime.Now.DayOfYear;
            return captions[dayOfYear % captions.Length];
        }

        public static string GetDefaultExerciseVideoUrl()
        {
            return "https://www.youtube.com/watch?v=gMaB-fG4u4g";
        }

        public static string GetDefaultImportantMessage()
        {
            return "Lääkärin vastaanotto klo 14:00";
        }

        public static string GetDefaultLatestReminder()
        {
            return ""; // Tyhjä string sen sijaan että testiviesti - viestit tulevat vain API:sta
        }

        public static List<Contact> GetDefaultContacts()
        {
            return new List<Contact>
            {
                new Contact { Name = "Tarja (tytär)", Phone = "+358401234567" },
                new Contact { Name = "Päivi (sisar)", Phone = "+358501234567" },
                new Contact { Name = "Eino (veli)", Phone = "+358451234567" }
            };
        }

        public static List<UpcomingAppointment> GetDefaultAppointments()
        {
            return new List<UpcomingAppointment>
            {
                new UpcomingAppointment
                {
                    Date = DateTime.Today.ToString("dd.MM.yyyy"),
                    Time = "14:00",
                    Type = "Lääkäriaika",
                    Message = "Kontrollikäynti",
                    Location = "Terveyskeskus"
                },
                new UpcomingAppointment
                {
                    Date = DateTime.Today.AddDays(1).ToString("dd.MM.yyyy"),
                    Time = "10:00",
                    Type = "Kauppa",
                    Message = "Ruokaostokset",
                    Location = "K-Market"
                }
            };
        }
    }
} 
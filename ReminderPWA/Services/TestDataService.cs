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
            // Käytetään luotettavaa placeholder palvelua
            var dayOfYear = DateTime.Now.DayOfYear;
            var imageId = (dayOfYear % 50) + 1; // 1-50 väliltä
            return $"https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop&crop=center&auto=format&q=80&ixlib=rb-4.0.3&seed={imageId}";
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
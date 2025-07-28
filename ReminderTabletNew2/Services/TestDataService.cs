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
                    Type = "LIIKUNTA", 
                    Description = "Kävely meren rannalla tai teatteri-iltapäivä", 
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
            // VÄLIAIKAINEN: Dynaaminen viikottainen kuva
            // Backend hallinnoi lopullisessa versiossa
            var weekNumber = GetCurrentWeekNumber();
            
            // Simuloidaan viikottaista vaihtumista
            var weeklyImages = new[]
            {
                "https://images.unsplash.com/photo-1444418776041-9c7e33cc5a9c?w=800&h=600&fit=crop&crop=faces", // Viikko 1: Perhe
                "https://images.unsplash.com/photo-1511895426328-dc8714191300?w=800&h=600&fit=crop&crop=faces", // Viikko 2: Lapset  
                "https://images.unsplash.com/photo-1475503572774-15a45e5d60b9?w=800&h=600&fit=crop&crop=faces", // Viikko 3: Isovanhemmat
                "https://images.unsplash.com/photo-1500917293891-ef795e70e1f6?w=800&h=600&fit=crop&crop=faces"  // Viikko 4: Koti
            };
            
            var imageIndex = (weekNumber - 1) % weeklyImages.Length;
            return weeklyImages[imageIndex];
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
            return GetWeeklyPhotoCaption();
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
            return "Muista ottaa aamulääkkeet ja syödä aamupala ennen ulkoilua. Mukavaa päivää! ☀️";
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
from django.shortcuts import render
from django.contrib.auth.decorators import login_required

def custom_404(request, exception):
    return render(request, '404.html', status=404)

def custom_500(request):
    return render(request, '404.html', status=500)



def menu(request):
    return render(request, 'index.html')